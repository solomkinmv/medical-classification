//
//  ViewFactory.swift
//  Green ACHI
//
//  Created by Maksym Solomkin on 26.06.2023.
//

import UIKit

class ViewFactory {
    static func navigationBarMultilineTitle(text: String) -> UILabel {
        let titleLabel = UILabel()
        titleLabel.text = text
        titleLabel.numberOfLines = 0
        titleLabel.textAlignment = .center
        titleLabel.font = UIFont.boldSystemFont(ofSize: 17.0)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        return titleLabel
    }
}
