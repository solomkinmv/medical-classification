//
//  UICollectionReusableViewExtension.swift
//  Green ACHI
//
//  Created by Maksym Solomkin on 23.06.2023.
//

import UIKit

extension UICollectionReusableView {
    static var reuseIdentifier: String {
        return String(describing: Self.self)
    }
}
