import csv
import json
from itertools import count
from typing import Dict


class Parser:
    lvl_zero_ids: Dict[str, int] = {}
    lvl_one_ids: Dict[str, int] = {}
    lvl_two_ids: Dict[str, int] = {}
    lvl_three_ids: Dict[str, int] = {}

    __id_generator = count(1)

    @staticmethod
    def parse_achi_file() -> Dict:
        achi_data: Dict = {
            0: {
                "children": []
            }
        }

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

                if lvl_zero_name_ua not in Parser.lvl_zero_ids:
                    generated_id = next(Parser.__id_generator)
                    Parser.lvl_zero_ids[lvl_zero_name_ua] = generated_id

                    achi_data[0]["children"].append(generated_id)

                    achi_data[generated_id] = {
                        "class": lvl_zero_clazz,
                        "name_ua": lvl_zero_name_ua,
                        "children": []
                    }
                id_zero = Parser.lvl_zero_ids[lvl_zero_name_ua]

                lvl_one_key = lvl_zero_name_ua + lvl_one_name_ua
                if lvl_one_key not in Parser.lvl_one_ids:
                    generated_id = next(Parser.__id_generator)
                    Parser.lvl_one_ids[lvl_one_key] = generated_id

                    achi_data[id_zero]["children"].append(generated_id)

                    achi_data[generated_id] = {
                        "code": lvl_one_code,
                        "name_ua": lvl_one_name_ua,
                        "children": []
                    }
                id_one = Parser.lvl_one_ids[lvl_one_key]

                lvl_two_key = lvl_one_name_ua + lvl_two_name_ua
                if lvl_two_key not in Parser.lvl_two_ids:
                    generated_id = next(Parser.__id_generator)
                    Parser.lvl_two_ids[lvl_two_key] = generated_id

                    achi_data[id_one]["children"].append(generated_id)

                    achi_data[generated_id] = {
                        "code": lvl_two_code,
                        "name_ua": lvl_two_name_ua,
                        "children": []
                    }
                id_two = Parser.lvl_two_ids[lvl_two_key]

                lvl_three_key = lvl_two_name_ua + lvl_three_name_ua
                if lvl_three_key not in Parser.lvl_three_ids:
                    generated_id = next(Parser.__id_generator)
                    Parser.lvl_three_ids[lvl_three_key] = generated_id

                    achi_data[id_two]["children"].append(generated_id)

                    achi_data[generated_id] = {
                        "code": lvl_three_code,
                        "name_ua": lvl_three_name_ua,
                        "children": []
                    }
                id_three = Parser.lvl_three_ids[lvl_three_key]
                achi_data[id_three]["children"].append({
                    "code": lvl_four_code,
                    "name_ua": lvl_four_name_ua,
                    "name_en": lvl_four_name_en
                })

        return achi_data


def write_data_to_json_file(tree: Dict) -> None:
    json_object = json.dumps(tree, indent=4, ensure_ascii=False)

    with open("achi.json", "w") as outfile:
        outfile.write(json_object)


if __name__ == '__main__':
    data_tree = Parser.parse_achi_file()
    write_data_to_json_file(data_tree)
