//
//  ViewController.swift
//  Green ACHI
//
//  Created by Maksym Solomkin on 06.06.2023.
//

import UIKit

class AchiListViewController: UICollectionViewController, UISearchBarDelegate {
    
    typealias DataSource = UICollectionViewDiffableDataSource<Int, String>
    typealias Snapshot = NSDiffableDataSourceSnapshot<Int, String>
    
    var dataSource: DataSource!
    var data: TreeNode?
    
    private let ukrainianComparator: (String, String) -> Bool = { $0.localizedCaseInsensitiveCompare($1) == .orderedAscending }
    
    private lazy var headerView: SearchCollectionReusableView = {
        let headerView = SearchCollectionReusableView(frame: CGRect(x: 0, y: 0, width: collectionView.bounds.width, height: 50))
        // Customize the header view if needed
        return headerView
    }()
    
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
        let keys: [String] = Array(children.keys).sorted(by: ukrainianComparator)
        
        let listLayout = listLayout()
        collectionView.collectionViewLayout = listLayout
        
        let cellRegistration = UICollectionView.CellRegistration {
            (cell: UICollectionViewListCell, indexPath: IndexPath, itemIdentifier: String) in
            let child = keys[indexPath.item]
            var contentConfiguration = cell.defaultContentConfiguration()
            contentConfiguration.text = children[child]!.nameUa
            cell.contentConfiguration = contentConfiguration
        }
        
        let headerRegistration = UICollectionView.SupplementaryRegistration<SearchCollectionReusableView>(elementKind: UICollectionView.elementKindSectionHeader) { [weak self] supplementaryView, _, _ in
            // Configure the header view as needed
            self?.configureHeaderView(supplementaryView)
        }
        
        dataSource = DataSource(collectionView: collectionView) {
            (collectionView: UICollectionView, indexPath: IndexPath, itemIdentifier: String) in
            return collectionView.dequeueConfiguredReusableCell(
                using: cellRegistration, for: indexPath, item: itemIdentifier)
        }
        
        // Register the supplementary view using supplementary registration
        dataSource.supplementaryViewProvider = { [weak self] collectionView, kind, indexPath in
            if kind == UICollectionView.elementKindSectionHeader {
                return self?.collectionView.dequeueConfiguredReusableSupplementary(using: headerRegistration, for: indexPath)
            }
            return nil
        }
        
        var snapshot = Snapshot()
        snapshot.appendSections([0])
        snapshot.appendItems(keys)
        
        // Apply the snapshot to the data source
        dataSource.apply(snapshot, animatingDifferences: true)
    }
    
    private func listLayout() -> UICollectionViewCompositionalLayout {
        var listConfiguration = UICollectionLayoutListConfiguration(appearance: .insetGrouped)
        listConfiguration.showsSeparators = true
        listConfiguration.backgroundColor = .clear
        listConfiguration.headerMode = .supplementary
        
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
    
    private func configureHeaderView(_ headerView: SearchCollectionReusableView) {
        headerView.searchBar.placeholder = "Пошук"
        headerView.searchBar.delegate = self
        
        // Customize the search bar appearance if needed
        headerView.searchBar.backgroundImage = UIImage()
    }
    
    func filterAndApplySnapshot(with searchText: String) {
        // Filter the list keys based on the search bar text
        let keys: [String] = data!.children!.keys
            .filter({ searchText.isEmpty ? true : $0.localizedCaseInsensitiveContains(searchText) })
            .sorted(by: ukrainianComparator)
        
        // Apply the filtered keys to update the collection view
        var snapshot = Snapshot()
        snapshot.appendSections([0])
        snapshot.appendItems(keys)
        
        // Apply the snapshot to the data source
        dataSource.apply(snapshot, animatingDifferences: true)
    }
    
    func searchBar(_ searchBar: UISearchBar, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
        // Calculate the new text after applying the replacement
        let currentText = searchBar.text ?? ""
        let newText = (currentText as NSString).replacingCharacters(in: range, with: text)
        
        // Apply the new text to the search bar
        searchBar.text = newText
        
        // Ensure that the search bar retains focus and cursor
        DispatchQueue.main.async {
            searchBar.becomeFirstResponder()
        }
        
        // Perform filtering and update the collection view as needed
        filterAndApplySnapshot(with: newText)
        
        // Return false to prevent the default behavior of the search bar
        return false
    }
    
    func searchBar(_ searchBar: UISearchBar, textDidChange searchText: String) {
        if searchText.isEmpty {
            filterAndApplySnapshot(with: "")
        } else {
            // Perform filtering and update the collection view based on the new search text
            filterAndApplySnapshot(with: searchText)
        }
    }
    
    
}

