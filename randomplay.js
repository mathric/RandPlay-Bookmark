let curTabId = null
let curTabId2 = null
let newTabId = null
let tabFlg = true

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

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    if(tabFlg) {
      curTabId = tab.id
      tabFlg = false
    }
    else {
      curTabId2 = tab.id
      tabFlg = true
    }      
  });
});