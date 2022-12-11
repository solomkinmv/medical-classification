import csv
import dataclasses
import json
from dataclasses import dataclass
from typing import List, Dict


class EnhancedJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if dataclasses.is_dataclass(o):
            return dataclasses.asdict(o)
        return super().default(o)


@dataclass
class RecordLevelFour:
    code: str
    name_ua: str
    name_en: str


@dataclass
class RecordLevelThree:
    code: str  # вісь блоків
    name_ua: str
    children: List[RecordLevelFour]

    def add(self, lvl_four_code: str, lvl_four_name_ua: str, lvl_four_name_en: str):
        self.children.append(RecordLevelFour(lvl_four_code, lvl_four_name_ua, lvl_four_name_en))


@dataclass
class RecordLevelTwo:
    code: str  # вісь процедурної типології
    name_ua: str
    children: Dict[str, RecordLevelThree]

    def add(self, lvl_three_code: str, lvl_three_name_ua: str,
            lvl_four_code: str, lvl_four_name_ua: str, lvl_four_name_en: str):
        if lvl_three_name_ua not in self.children:
            self.children[lvl_three_name_ua] = RecordLevelThree(lvl_three_code, lvl_three_name_ua, [])
        self.children[lvl_three_name_ua].add(lvl_four_code, lvl_four_name_ua, lvl_four_name_en)


@dataclass
class RecordLevelOne:
    code: str  # вісь анатомічної локалізації
    name_ua: str
    children: Dict[str, RecordLevelTwo]

    def add(self, lvl_two_code: str, lvl_two_name_ua: str, lvl_three_code: str, lvl_three_name_ua: str,
            lvl_four_code: str, lvl_four_name_ua: str, lvl_four_name_en: str):
        if lvl_two_name_ua not in self.children:
            self.children[lvl_two_name_ua] = RecordLevelTwo(lvl_two_code, lvl_two_name_ua, {})
        self.children[lvl_two_name_ua].add(lvl_three_code, lvl_three_name_ua, lvl_four_code, lvl_four_name_ua,
                                           lvl_four_name_en)


@dataclass
class RecordLevelZero:
    clazz: str  # клас
    name_ua: str
    children: Dict[str, RecordLevelOne]

    def add(self, lvl_one_code: str, lvl_one_name_ua: str,
            lvl_two_code: str, lvl_two_name_ua: str, lvl_three_code: str, lvl_three_name_ua: str,
            lvl_four_code: str, lvl_four_name_ua: str, lvl_four_name_en: str):
        if lvl_one_name_ua not in self.children:
            self.children[lvl_one_name_ua] = RecordLevelOne(lvl_one_code, lvl_one_name_ua, {})
        self.children[lvl_one_name_ua].add(lvl_two_code, lvl_two_name_ua, lvl_three_code, lvl_three_name_ua,
                                           lvl_four_code, lvl_four_name_ua, lvl_four_name_en)


@dataclass
class DataTree:
    children: Dict[str, RecordLevelZero]

    def add(self, lvl_zero_clazz: str, lvl_zero_name_ua: str, lvl_one_code: str, lvl_one_name_ua: str,
            lvl_two_code: str, lvl_two_name_ua: str, lvl_three_code: str, lvl_three_name_ua: str,
            lvl_four_code: str, lvl_four_name_ua: str, lvl_four_name_en: str):
        if lvl_zero_name_ua not in self.children:
            self.children[lvl_zero_name_ua] = RecordLevelZero(lvl_zero_clazz, lvl_zero_name_ua, {})
        self.children[lvl_zero_name_ua].add(lvl_one_code, lvl_one_name_ua, lvl_two_code, lvl_two_name_ua,
                                            lvl_three_code, lvl_three_name_ua, lvl_four_code, lvl_four_name_ua,
                                            lvl_four_name_en)


def parse_achi_file() -> DataTree:
    tree = DataTree({})
    with open('ACHI UKR-ENG.csv', 'r') as csv_file:
        reader = csv.reader(csv_file, delimiter=';', )
        next(reader)
        next(reader)

        for row in reader:
            lvl_zero_clazz = row[0].strip()
            lvl_zero_name_ua = row[1].strip()
            lvl_one_code = row[2].strip()
            lvl_one_name_ua = row[3].strip()
            lvl_two_code = row[4].strip()
            lvl_two_name_ua = row[5].strip()
            lvl_three_code = row[6].strip()
            lvl_three_name_ua = row[7].strip()
            lvl_four_code = row[8].strip()
            lvl_four_name_ua = row[9].strip()
            lvl_four_name_en = row[10].strip()
            tree.add(lvl_zero_clazz, lvl_zero_name_ua, lvl_one_code, lvl_one_name_ua, lvl_two_code, lvl_two_name_ua,
                     lvl_three_code, lvl_three_name_ua, lvl_four_code, lvl_four_name_ua, lvl_four_name_en)

    return tree


def write_data_to_json_file(tree: DataTree) -> None:
    json_object = json.dumps(tree, indent=4, ensure_ascii=False, cls=EnhancedJSONEncoder)

    with open("data/achi.json", "w") as outfile:
        outfile.write(json_object)


if __name__ == '__main__':
    data_tree = parse_achi_file()
    write_data_to_json_file(data_tree)
