function searchFolder(bookmarks, target) {
  for(let i = 0; i < bookmarks.length; i++) {
    let bookmark = bookmarks[i]
    if(bookmark.children) {
      if(bookmark.title == target) {
        console.log(bookmark)
      }
      else {
        searchFolder(bookmark.children, target)
      }   
    }
  }
}

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.bookmarks.getTree(function(TreeNodes) {
    searchFolder(TreeNodes, "music")
  })
})