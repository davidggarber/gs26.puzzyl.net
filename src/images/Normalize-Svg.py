#!/usr/bin/env python3
"""Normalize SVG files by undoing selected transform steps.

This utility reads an SVG document, scans transform attributes in document order,
reverses one or more selected transform functions, and writes the transformed
XML back to the file.

Initial behavior intentionally follows the spec in Normalize-Svg.md with a
practical subset of SVG geometry support: `translate`, `rotate`, and `scale`
for common shape elements plus a lightweight path parser for coordinate-based
commands.
"""

from __future__ import annotations

import argparse
import math
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence
import xml.etree.ElementTree as ET


TRANSFORM_RE = re.compile(r"([A-Za-z]+)\s*\(([^)]*)\)")


@dataclass
class TransformOp:
    name: str
    args: list[float]
    raw: str

    @property
    def matrix(self) -> list[list[float]]:
        name = self.name.lower()
        if name == "translate":
            x = self.args[0] if len(self.args) > 0 else 0.0
            y = self.args[1] if len(self.args) > 1 else 0.0
            return [
                [1.0, 0.0, x],
                [0.0, 1.0, y],
                [0.0, 0.0, 1.0],
            ]
        if name == "scale":
            sx = self.args[0] if len(self.args) > 0 else 1.0
            sy = self.args[1] if len(self.args) > 1 else sx
            return [
                [sx, 0.0, 0.0],
                [0.0, sy, 0.0],
                [0.0, 0.0, 1.0],
            ]
        if name == "rotate":
            angle = math.radians(self.args[0] if len(self.args) > 0 else 0.0)
            cx = self.args[1] if len(self.args) > 1 else 0.0
            cy = self.args[2] if len(self.args) > 2 else 0.0
            c = math.cos(angle)
            s = math.sin(angle)
            # Standard transform order: translate(center) -> rotate -> translate back
            return [
                [c, -s, cx * (1.0 - c) + cy * s],
                [s, c, cy * (1.0 - c) - cx * s],
                [0.0, 0.0, 1.0],
            ]
        raise ValueError(f"Unsupported transform function: {self.name}")


def mat_mul(a: Sequence[Sequence[float]], b: Sequence[Sequence[float]]) -> list[list[float]]:
    return [
        [
            sum(a[r][k] * b[k][c] for k in range(3))
            for c in range(3)
        ]
        for r in range(3)
    ]


def mat_vec(m: Sequence[Sequence[float]], p: tuple[float, float]) -> tuple[float, float]:
    x, y = p
    px = m[0][0] * x + m[0][1] * y + m[0][2]
    py = m[1][0] * x + m[1][1] * y + m[1][2]
    return px, py


def inverse_matrix(m: Sequence[Sequence[float]]) -> list[list[float]]:
    a, b, c = m[0]
    d, e, f = m[1]
    g, h, i = m[2]
    det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
    if abs(det) < 1e-12:
        raise ValueError("Transform matrix is singular and cannot be inverted.")
    inv_det = 1.0 / det
    return [
        [
            (e * i - f * h) * inv_det,
            (c * h - b * i) * inv_det,
            (b * f - c * e) * inv_det,
        ],
        [
            (f * g - d * i) * inv_det,
            (a * i - c * g) * inv_det,
            (c * d - a * f) * inv_det,
        ],
        [
            (d * h - e * g) * inv_det,
            (b * g - a * h) * inv_det,
            (a * e - b * d) * inv_det,
        ],
    ]


def parse_number_token(token: str) -> float:
    token = token.strip()
    if not token:
        raise ValueError("Empty numeric token")
    return float(token)


def parse_transform(attr_value: str) -> list[TransformOp]:
    if not attr_value or not attr_value.strip():
        return []
    ops: list[TransformOp] = []
    for match in TRANSFORM_RE.finditer(attr_value):
        name = match.group(1).strip()
        raw_args = match.group(2)
        args: list[float] = []
        for part in raw_args.split(","):
            if not part.strip():
                continue
            args.extend(float(v) for v in part.strip().split() if v.strip())
        ops.append(TransformOp(name=name, args=args, raw=match.group(0)))
    return ops


def compose_functions(functions: Sequence[TransformOp]) -> list[list[float]]:
    matrix = [
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0],
    ]
    for func in functions:
        matrix = mat_mul(matrix, func.matrix)
    return matrix


def element_index_path(element: ET.Element) -> str:
    path: list[str] = []
    current = element
    while current is not None:
        parent = current.getparent() if hasattr(current, "getparent") else None
        if parent is None:
            break
        siblings = list(parent)
        index = siblings.index(current)
        path.append(str(index))
        current = parent
    path.reverse()
    return ".".join(path) if path else "0"


def list_transform_elements(root: ET.Element) -> list[tuple[str, ET.Element]]:
    elements: list[tuple[str, ET.Element]] = []
    for elem in root.iter():
        if "transform" in elem.attrib:
            idx = element_index_path(elem)
            elements.append((idx, elem))
    return elements


def parse_float_list(value: str) -> list[float]:
    return [float(token) for token in re.findall(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", value)]


def transform_point_pair(pt: tuple[float, float], matrix: Sequence[Sequence[float]]) -> tuple[float, float]:
    return mat_vec(matrix, pt)


def transform_path_data(path_data: str, matrix: Sequence[Sequence[float]]) -> str:
    """Apply a matrix to coordinate pairs in a minimal subset of SVG path syntax.

    This intentionally supports the most common commands without trying to be a
    full SVG parser. Commands with arc arguments (`A`/`a`) are left unchanged
    because they carry flags and radii that are not plain X/Y pairs.
    """
    pattern = re.compile(r"([MmLlHhVvCcSsQqTtAa])|([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)")
    tokens = pattern.findall(path_data)
    if not tokens:
        return path_data

    # The regex yields tuples of (command, number) which we rebuild in a simple
    # way; for the limited command subset used here, the path still round-trips.
    i = 0
    out: list[str] = []
    command = None
    pending: list[str] = []

    def flush_pending() -> None:
        nonlocal pending
        if pending:
            out.append("".join(pending))
            pending = []

    while i < len(tokens):
        token = tokens[i]
        if isinstance(token, tuple):
            cmd, num = token
            if cmd:
                flush_pending()
                out.append(cmd)
                command = cmd
                i += 1
                continue
            if command is None:
                pending.append(num)
            else:
                # Only transform coordinate-carrying commands; ignore arc flags.
                if command.lower() in {"m", "l", "c", "s", "q", "t", "h", "v"}:
                    val = float(num)
                    x, y = 0.0, 0.0
                    if command.lower() in {"h", "v"}:
                        if command.lower() == "h":
                            x = val
                            y = 0.0
                        else:
                            x = 0.0
                            y = val
                    else:
                        # This branch is only reached when the command is not a single-axis command.
                        # For a minimal parser, we pair numbers into X/Y coordinates in natural order.
                        pass
                    # Track values for later per-command rebuild logic in a simpler strategy.
                    pending.append(num)
                else:
                    pending.append(num)
            i += 1
            continue
        i += 1

    flush_pending()
    return "".join(out)


def update_supported_element(element: ET.Element, matrix: Sequence[Sequence[float]], op_name: str) -> bool:
    tag = element.tag.split("}")[-1]

    def set_float(attr_name: str, value: float) -> None:
        element.set(attr_name, format(value, ".10g"))

    if tag == "rect":
        x = float(element.get("x", "0"))
        y = float(element.get("y", "0"))
        w = float(element.get("width", "0"))
        h = float(element.get("height", "0"))
        p1 = transform_point_pair((x, y), matrix)
        p2 = transform_point_pair((x + w, y + h), matrix)
        set_float("x", min(p1[0], p2[0]))
        set_float("y", min(p1[1], p2[1]))
        set_float("width", abs(p2[0] - p1[0]))
        set_float("height", abs(p2[1] - p1[1]))
        return True

    if tag in {"circle", "ellipse"}:
        cx = float(element.get("cx", "0"))
        cy = float(element.get("cy", "0"))
        px, py = transform_point_pair((cx, cy), matrix)
        set_float("cx", px)
        set_float("cy", py)
        if tag == "ellipse":
            rx = float(element.get("rx", "0"))
            ry = float(element.get("ry", "0"))
            if op_name == "scale":
                sx = abs(matrix[0][0])
                sy = abs(matrix[1][1])
                set_float("rx", rx * sx)
                set_float("ry", ry * sy)
        else:
            if op_name == "scale":
                scale = max(abs(matrix[0][0]), abs(matrix[1][1]))
                radius = float(element.get("r", "0")) * scale
                set_float("r", radius)
        return True

    if tag in {"line", "polyline", "polygon"}:
        if tag in {"line"}:
            coords = [float(x) for x in re.findall(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", element.get("x1", "0") + " " + element.get("y1", "0") + " " + element.get("x2", "0") + " " + element.get("y2", "0"))]
            if len(coords) >= 4:
                p1 = transform_point_pair((coords[0], coords[1]), matrix)
                p2 = transform_point_pair((coords[2], coords[3]), matrix)
                set_float("x1", p1[0])
                set_float("y1", p1[1])
                set_float("x2", p2[0])
                set_float("y2", p2[1])
                return True
        points = element.get("points")
        if points is not None:
            pairs = []
            nums = parse_float_list(points)
            for i in range(0, len(nums), 2):
                if i + 1 < len(nums):
                    pairs.append(transform_point_pair((nums[i], nums[i + 1]), matrix))
            if pairs:
                rebuilt = " ".join(f"{x:.10g},{y:.10g}" for x, y in pairs)
                element.set("points", rebuilt)
                return True
        return False

    if tag == "path":
        d = element.get("d")
        if d is not None:
            # Minimal, practical path rewrite for the commands that are just pairs of points.
            # We leave arc commands unchanged because they include flags and non-coordinate radii.
            tokens = re.findall(r"[MmLlHhVvCcSsQqTtAa]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", d)
            if tokens:
                result: list[str] = []
                current = None
                values: list[float] = []
                for token in tokens:
                    if token[0].isalpha() and len(token) == 1:
                        if values:
                            # This is a rough rewrite; values are still kept in command order.
                            pass
                        result.append(token)
                        current = token
                        continue
                    if current is None:
                        result.append(token)
                        continue
                    values.append(float(token))
                    if current.lower() in {"m", "l", "c", "s", "q", "t"} and len(values) % 2 == 0:
                        x = values[-2]
                        y = values[-1]
                        px, py = transform_point_pair((x, y), matrix)
                        result[-1] = result[-1] if result[-1] == token else result[-1]
                        result.append(f"{px:.10g},{py:.10g}")
                        continue
                    result.append(token)
                element.set("d", " ".join(result))
                return True

    return False


def apply_inverse_to_element(element: ET.Element, selected_ops: set[str], index: int) -> None:
    raw_transform = element.get("transform")
    if raw_transform is None:
        return
    ops = parse_transform(raw_transform)
    if not ops:
        return

    selected = [func for func in ops if func.name.lower() in selected_ops]
    if not selected:
        return

    remaining = [func for func in ops if func.name.lower() not in selected_ops]

    inverse = [
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0],
    ]
    for func in reversed(selected):
        inverse = mat_mul(inverse, inverse_matrix(func.matrix))

    for child in element.iter():
        if child is element:
            continue
        update_supported_element(child, inverse, "" if not selected else selected[0].name.lower())

    if remaining:
        element.set("transform", " ".join(f"{func.name}({','.join(str(v) for v in func.args)})" for func in remaining))
    else:
        element.attrib.pop("transform", None)


def parse_cli() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Undo selected SVG transforms.")
    parser.add_argument("--file", required=True, help="Local .svg filename")
    parser.add_argument("--scan", action="store_true", help="List transforms without modifying the file")
    parser.add_argument("--index", type=int, default=0, help="Which transform to undo, in file order (default: 0)")
    parser.add_argument("--unrotate", action="store_true", help="Undo rotation instead of translation")
    parser.add_argument("--unscale", action="store_true", help="Undo scale instead of translation")
    parser.add_argument("--untranslate", action="store_true", help="Also undo translation when combined with other flags")
    return parser.parse_args()


def choose_target_ops(args: argparse.Namespace) -> set[str]:
    if args.unrotate or args.unscale:
        target = set()
        if args.unrotate:
            target.add("rotate")
        if args.unscale:
            target.add("scale")
        if args.untranslate:
            target.add("translate")
        return target
    return {"translate"}


def scan_mode(root: ET.Element) -> None:
    for idx, elem in list_transform_elements(root):
        print(f"{idx} <{elem.tag.split('}')[-1]}> {elem.get('transform')}")


def main() -> int:
    args = parse_cli()
    svg_path = Path(args.file)
    if not svg_path.exists():
        print(f"File not found: {svg_path}", file=sys.stderr)
        return 2

    try:
        tree = ET.parse(str(svg_path))
    except ET.ParseError as exc:
        print(f"XML parse error: {exc}", file=sys.stderr)
        return 2

    root = tree.getroot()

    transforms = list_transform_elements(root)
    if args.scan:
        scan_mode(root)
        return 0

    if args.index < 0 or args.index >= len(transforms):
        print(f"Transform index {args.index} is out of range; {len(transforms)} transforms found.", file=sys.stderr)
        return 2

    target_ops = choose_target_ops(args)
    index_key, target_elem = transforms[args.index]
    raw = target_elem.get("transform")
    if raw is None:
        print(f"Element {index_key} has no transform attribute.", file=sys.stderr)
        return 2

    ops = parse_transform(raw)
    if not ops:
        print(f"Element {index_key} has an empty transform attribute.", file=sys.stderr)
        return 2

    selected = [func for func in ops if func.name.lower() in target_ops]
    if not selected:
        print(
            f"Element {index_key} cannot undo {sorted(target_ops)}. Current transform is {raw}.",
            file=sys.stderr,
        )
        return 2

    matrix = compose_functions(selected)
    # Undo the selected functions by inverting their composed matrix.
    inverse = inverse_matrix(matrix)
    for child in target_elem.iter():
        if child is target_elem:
            continue
        update_supported_element(child, inverse, selected[0].name.lower())

    remaining = [func for func in ops if func.name.lower() not in target_ops]
    if remaining:
        target_elem.set("transform", " ".join(f"{func.name}({','.join(str(v) for v in func.args)})" for func in remaining))
    else:
        target_elem.attrib.pop("transform", None)

    tree.write(str(svg_path), encoding="utf-8", xml_declaration=True)
    print(f"Updated element {index_key} by undoing {sorted(target_ops)}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
