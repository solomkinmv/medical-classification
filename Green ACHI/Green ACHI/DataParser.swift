//
//  DataParser.swift
//  Green ACHI
//
//  Created by Maksym Solomkin on 06.06.2023.
//

import Foundation

class DataParser {
    
    func readData() throws -> TreeNode {
        if let jsonFilePath = Bundle.main.path(forResource: "achi", ofType: "json"),
           let jsonData = try? Data(contentsOf: URL(fileURLWithPath: jsonFilePath)) {
            do {
                let decoder = JSONDecoder()
//                decoder.keyDecodingStrategy = .convertFromSnakeCase
                let rootNode = try decoder.decode(TreeNode.self, from: jsonData)
                // Use the 'rootNode' structure to access the parsed data
                return rootNode
            } catch {
                print("Error parsing JSON:", error.localizedDescription)
            }
        } else {
            print("JSON resource file not found.")
        }
        throw ParsingError.failedToParse
    }
}

struct TreeNode: Decodable {
    let clazz: String?
    let code: String?
    let nameUa: String?
    let nameEn: String?
    let children: [String: TreeNode]?
    let directChildren: [TreeNode]?

    enum CodingKeys: String, CodingKey {
        case clazz, code, nameUa = "name_ua", nameEn = "name_en", children, directChildren
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        clazz = try container.decodeIfPresent(String.self, forKey: .clazz)
        code = try container.decodeIfPresent(String.self, forKey: .code)
        nameUa = try container.decodeIfPresent(String.self, forKey: .nameUa)
        nameEn = try container.decodeIfPresent(String.self, forKey: .nameEn)
        children = try container.decodeIfPresent([String: TreeNode].self, forKey: .children)
        directChildren = try container.decodeIfPresent([TreeNode].self, forKey: .directChildren)
    }
}



enum ParsingError : Error {
    case failedToParse, fileNotFound
}
