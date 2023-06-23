//
//  SearchCollectionReusableView.swift
//  Green ACHI
//
//  Created by Maksym Solomkin on 18.06.2023.
//

import UIKit

class SearchCollectionReusableView: UICollectionReusableView {
    let searchBar: UISearchBar = {
            let searchBar = UISearchBar()
            // Customize the search bar as per your requirements
            return searchBar
        }()
        
        override init(frame: CGRect) {
            super.init(frame: frame)
            addSubview(searchBar)
            
            // Add constraints to position the search bar within the header view
            searchBar.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                searchBar.topAnchor.constraint(equalTo: topAnchor),
                searchBar.leadingAnchor.constraint(equalTo: leadingAnchor),
                searchBar.trailingAnchor.constraint(equalTo: trailingAnchor),
                searchBar.bottomAnchor.constraint(equalTo: bottomAnchor)
            ])
        }
        
        required init?(coder: NSCoder) {
            fatalError("init(coder:) has not been implemented")
        }
}
