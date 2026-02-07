import csv
import json
import re
from collections import OrderedDict


def smart_capitalize(text: str) -> str:
    """Capitalize first letter but preserve case of medical codes in parentheses."""
    if not text:
        return text
    result = text[0].upper() + text[1:].lower()
    # Restore uppercase for ICD code ranges like (A00-B99), (H00-H59)
    result = re.sub(
        r'\(([a-z]\d{2})\s*[-–]\s*([a-z]\d{2})',
        lambda m: f'({m.group(1).upper()}-{m.group(2).upper()}',
        result
    )
    # Also handle single codes and complex ranges like (U50 –U73, U90, V00-Y98)
    result = re.sub(
        r'(?<=[\(,\s])([a-z])(\d{2})',
        lambda m: m.group(1).upper() + m.group(2),
        result
    )
    return result


def parse_mkh10_file(csv_path: str) -> dict:
    """
    Parse the НК 025:2021 CSV into a hierarchical JSON structure
    matching the ACHI app format.

    CSV columns (semicolon-separated):
    0: Клас        (e.g. "Клас 1")
    1: Опис класу  (e.g. "ДЕЯКІ ІНФЕКЦІЙНІ ТА ПАРАЗИТАРНІ ХВОРОБИ (A00-B99)")
    2: Код блоку   (e.g. "A00-A09")
    3: Назва блоку (e.g. "Кишкові інфекційні хвороби")
    4: Код нозології    (e.g. "A00")
    5: Нозологія EN     (e.g. "Cholera")
    6: Нозологія UA     (e.g. "Холера")
    7: Код 4-digit      (e.g. "A00.0")
    8: 4-digit EN       (e.g. "Cholera due to ...")
    9: 4-digit UA       (e.g. "Холера, спричинена ...")
    10: Код 5-digit     (e.g. "A41.50" or "-")
    11: 5-digit EN      (e.g. "-" when no 5-digit)
    12: 5-digit UA      (e.g. "Септицемія, ...")

    Output hierarchy:
    Class → Block → Nosology → leaf codes (4-digit or 5-digit)

    When a nosology has some entries with 5-digit codes and some without,
    we group by 4-digit code: if any 5-digit codes exist for a 4-digit code,
    the 4-digit becomes a category and 5-digit codes are its leaves.
    If no 5-digit codes exist, the 4-digit code itself is a leaf.
    """
    # First pass: collect all rows and determine which 4-digit codes have 5-digit children
    rows = []
    four_digit_has_five = set()

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=';')
        header = next(reader)  # skip header

        for row in reader:
            if len(row) < 13:
                continue
            rows.append(row)
            code_5 = row[10].strip()
            if code_5 and code_5 != '-':
                four_digit_has_five.add(row[7].strip())

    # Second pass: build hierarchy
    tree = OrderedDict()

    for row in rows:
        clazz = row[0].strip()
        class_desc = smart_capitalize(row[1].strip())
        block_code = row[2].strip()
        block_name = smart_capitalize(row[3].strip())
        nosology_code = row[4].strip()
        nosology_en = row[5].strip()
        nosology_ua = smart_capitalize(row[6].strip())
        code_4 = row[7].strip()
        name_4_en = row[8].strip()
        name_4_ua = smart_capitalize(row[9].strip())
        code_5 = row[10].strip()
        name_5_en = row[11].strip()
        name_5_ua = smart_capitalize(row[12].strip())

        # Level 0: Class
        if class_desc not in tree:
            tree[class_desc] = {
                "clazz": clazz,
                "name_ua": class_desc,
                "children": OrderedDict()
            }
        class_node = tree[class_desc]

        # Level 1: Block
        if block_name not in class_node["children"]:
            class_node["children"][block_name] = {
                "code": block_code,
                "name_ua": block_name,
                "children": OrderedDict()
            }
        block_node = class_node["children"][block_name]

        # Level 2: Nosology (3-char code)
        if nosology_ua not in block_node["children"]:
            block_node["children"][nosology_ua] = {
                "code": nosology_code,
                "name_ua": nosology_ua,
                "name_en": nosology_en,
                "children": OrderedDict()  # will be converted to list later
            }
        nosology_node = block_node["children"][nosology_ua]

        # Level 3+: Disease codes
        # Skip rows where nosology has no subdivisions (code_4 is "-")
        # These terminal nosologies become their own leaf codes
        if code_4 == '-':
            if "_leaves" not in nosology_node["children"]:
                nosology_node["children"]["_leaves"] = []
            leaves = nosology_node["children"]["_leaves"]
            leaf = {
                "code": nosology_code,
                "name_ua": nosology_ua,
                "name_en": nosology_en if nosology_en and nosology_en != '-' else ""
            }
            if not any(c["code"] == nosology_code for c in leaves):
                leaves.append(leaf)
            continue

        has_five = code_4 in four_digit_has_five

        if has_five:
            # 4-digit code becomes a category node with 5-digit leaves
            if name_4_ua not in nosology_node["children"]:
                nosology_node["children"][name_4_ua] = {
                    "code": code_4,
                    "name_ua": name_4_ua,
                    "name_en": name_4_en,
                    "children": []
                }
            four_node = nosology_node["children"][name_4_ua]

            if code_5 and code_5 != '-':
                en_name = name_5_en if name_5_en and name_5_en != '-' else name_4_en
                leaf = {
                    "code": code_5,
                    "name_ua": name_5_ua if name_5_ua and name_5_ua != '-' else name_4_ua,
                    "name_en": en_name if en_name and en_name != '-' else ""
                }
                # Avoid duplicates
                if not any(c["code"] == code_5 for c in four_node["children"]):
                    four_node["children"].append(leaf)
        else:
            # 4-digit code is a leaf directly under nosology
            # We collect leaves in a special "_leaves" key
            if "_leaves" not in nosology_node["children"]:
                nosology_node["children"]["_leaves"] = []
            leaves = nosology_node["children"]["_leaves"]
            leaf = {
                "code": code_4,
                "name_ua": name_4_ua,
                "name_en": name_4_en if name_4_en and name_4_en != '-' else ""
            }
            if not any(c["code"] == code_4 for c in leaves):
                leaves.append(leaf)

    # Post-process: convert nosology children
    # If a nosology has only _leaves (no 5-digit subcategories), make children a flat list
    # If it has both _leaves and 5-digit categories, merge them
    for class_node in tree.values():
        for block_node in class_node["children"].values():
            for nosology_key, nosology_node in block_node["children"].items():
                children = nosology_node["children"]
                leaves = children.pop("_leaves", [])
                categories = {k: v for k, v in children.items()}

                if not categories and leaves:
                    # All 4-digit codes are leaves
                    nosology_node["children"] = leaves
                elif categories and not leaves:
                    # All have 5-digit subcategories
                    nosology_node["children"] = categories
                elif categories and leaves:
                    # Mix: some 4-digit are leaves, some have 5-digit children
                    # Make the leaves into a flat list under the nosology
                    # by converting each leaf into a single-item category
                    # Actually, let's keep the categories as-is and add leaves directly
                    # The simplest approach: wrap leaves in a category named after themselves
                    for leaf in leaves:
                        categories[leaf["name_ua"]] = {
                            "code": leaf["code"],
                            "name_ua": leaf["name_ua"],
                            "name_en": leaf["name_en"],
                            "children": [leaf]
                        }
                    nosology_node["children"] = categories
                else:
                    # Empty - shouldn't happen
                    nosology_node["children"] = []

    result = {"children": tree}
    return result


def count_stats(tree: dict) -> dict:
    """Count statistics about the generated tree."""
    stats = {
        "classes": 0,
        "blocks": 0,
        "nosologies": 0,
        "leaf_codes": 0,
    }

    for class_node in tree["children"].values():
        stats["classes"] += 1
        for block_node in class_node["children"].values():
            stats["blocks"] += 1
            for nosology_node in block_node["children"].values():
                stats["nosologies"] += 1
                children = nosology_node["children"]
                if isinstance(children, list):
                    stats["leaf_codes"] += len(children)
                else:
                    for sub_node in children.values():
                        sub_children = sub_node["children"]
                        if isinstance(sub_children, list):
                            stats["leaf_codes"] += len(sub_children)

    return stats


def write_json(data: dict, output_path: str) -> None:
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


if __name__ == '__main__':
    csv_path = '../mkh10-data/nk-025-2021.csv'
    output_path = 'data/mkh10.json'

    print(f"Parsing {csv_path}...")
    tree = parse_mkh10_file(csv_path)

    stats = count_stats(tree)
    print(f"Statistics:")
    print(f"  Classes: {stats['classes']}")
    print(f"  Blocks: {stats['blocks']}")
    print(f"  Nosologies: {stats['nosologies']}")
    print(f"  Leaf codes: {stats['leaf_codes']}")

    print(f"Writing to {output_path}...")
    write_json(tree, output_path)

    print("Done!")
