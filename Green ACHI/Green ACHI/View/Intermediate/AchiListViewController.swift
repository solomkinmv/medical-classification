//
//  ViewController.swift
//  Green ACHI
//
//  Created by Maksym Solomkin on 06.06.2023.
//

import UIKit

class AchiListViewController: UICollectionViewController {
    
    typealias DataSource = UICollectionViewDiffableDataSource<Int, String>
    typealias Snapshot = NSDiffableDataSourceSnapshot<Int, String>
    
    var dataSource: DataSource!
    var data: TreeNode?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        if data == nil {
            data = try! DataParser().readData()
        }

        setUpHighLevelNodesView()
    }
    
    private func setUpHighLevelNodesView() {
        let children = data!.children!
        let keys: [String] = Array(data!.children!.keys.sorted())
        
        let listLayout = listLayout()
        collectionView.collectionViewLayout = listLayout
        
        let cellRegistration = UICollectionView.CellRegistration {
            (cell: UICollectionViewListCell, indexPath: IndexPath, itemIdentifier: String) in
            let child = keys[indexPath.item]
            var contentConfiguration = cell.defaultContentConfiguration()
            contentConfiguration.text = children[child]!.nameUa
            cell.contentConfiguration = contentConfiguration
        }
        
        
        dataSource = DataSource(collectionView: collectionView) {
            (collectionView: UICollectionView, indexPath: IndexPath, itemIdentifier: String) in
            return collectionView.dequeueConfiguredReusableCell(
                using: cellRegistration, for: indexPath, item: itemIdentifier)
        }
        
        var snapshot = Snapshot()
        snapshot.appendSections([0])
        snapshot.appendItems(keys)
        
        // Apply the snapshot to the data source
        dataSource.apply(snapshot, animatingDifferences: true)
    }
    
    private func listLayout() -> UICollectionViewCompositionalLayout {
        var listConfiguration = UICollectionLayoutListConfiguration(appearance: .grouped)
        listConfiguration.showsSeparators = true
        listConfiguration.backgroundColor = .clear
        return UICollectionViewCompositionalLayout.list(using: listConfiguration)
    }
    
    // Handle selection of a collection view item
    override func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        let selectedItem = dataSource.itemIdentifier(for: indexPath)
        
        let nextNode: TreeNode = data!.children![selectedItem!]!
        if (nextNode.children != nil) {
            let nextVc = storyboard?.instantiateViewController(withIdentifier: "list") as! AchiListViewController
            nextVc.navigationItem.title = selectedItem
            nextVc.data = nextNode
            navigationController?.pushViewController(nextVc, animated: true)
        } else {
            let nextVc = storyboard?.instantiateViewController(withIdentifier: "result") as! ResultingViewController
            nextVc.navigationItem.title = selectedItem
            nextVc.childNodes = nextNode.directChildren
            navigationController?.pushViewController(nextVc, animated: true)
        }
    }
}

