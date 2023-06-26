//
//  ResultingViewController.swift
//  Green ACHI
//
//  Created by Maksym Solomkin on 18.06.2023.
//

import UIKit

class ResultingViewController: UICollectionViewController {
    
    typealias DataSource = UICollectionViewDiffableDataSource<Int, String>
    typealias Snapshot = NSDiffableDataSourceSnapshot<Int, String>
    
    var dataSource: DataSource!
    var childNodes: [TreeNode]?

    override func viewDidLoad() {
        super.viewDidLoad()

        setUpLowLevelNodesView()
        navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .cancel, target: self, action: #selector(goToHome))
    }
    
    private func setUpLowLevelNodesView() {
        let listLayout = listLayout()
        collectionView.collectionViewLayout = listLayout
        
        let cellRegistration = UICollectionView.CellRegistration { [self]
            (cell: UICollectionViewListCell, indexPath: IndexPath, itemIdentifier: String) in
            let child = indexPath.item
            var contentConfiguration = cell.defaultContentConfiguration()
            contentConfiguration.text = self.childNodes![child].code! + ": " + self.childNodes![child].nameUa!
            contentConfiguration.secondaryText = self.childNodes![child].nameEn
            cell.contentConfiguration = contentConfiguration
        }
        
        
        dataSource = DataSource(collectionView: collectionView) {
            (collectionView: UICollectionView, indexPath: IndexPath, itemIdentifier: String) in
            return collectionView.dequeueConfiguredReusableCell(
                using: cellRegistration, for: indexPath, item: itemIdentifier)
        }
        
        var snapshot = Snapshot()
        snapshot.appendSections([0])
        snapshot.appendItems(childNodes!.map( { $0.nameUa! }))
        
        // Apply the snapshot to the data source
        dataSource.apply(snapshot, animatingDifferences: true)
    }
    
    private func listLayout() -> UICollectionViewCompositionalLayout {
        var listConfiguration = UICollectionLayoutListConfiguration(appearance: .grouped)
        listConfiguration.showsSeparators = true
        listConfiguration.backgroundColor = .clear
        return UICollectionViewCompositionalLayout.list(using: listConfiguration)
    }

    @objc private func goToHome() {
        navigationController?.popToRootViewController(animated: true)
    }
}
