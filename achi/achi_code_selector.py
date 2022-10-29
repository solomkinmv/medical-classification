import json
from typing import Dict

from achi_parser import DataTree


def parse_data_tree() -> Dict:
    # Opening JSON file
    with open('achi.json', 'r') as openfile:
        return json.load(openfile)


def get_code(data: Dict):
    lvl_zero = input("Choose lvl zero: {}".format(data['children'].keys()))
    record_zero = data['children'][lvl_zero]
    lvl_one = input("Choose lvl one: {}".format(record_zero['children'].keys()))
    record_one = record_zero['children'][lvl_one]
    lvl_two = input("Choose lvl two: {}".format(record_one['children'].keys()))
    record_two = record_one['children'][lvl_two]
    lvl_three = input("Choose lvl three: {}".format(record_two['children'].keys()))
    record_three = record_two['children'][lvl_three]
    lvl_four_idx = int(input("Choose lvl four idx: {}".format(record_three['children'])))
    record_four = record_three['children'][lvl_four_idx]
    print(record_four)


if __name__ == '__main__':
    get_code(parse_data_tree())
