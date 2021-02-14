let curTabId = null
let curTabId2 = null
let newTabId = null
let tabFlg = true
let waitTime = 2000
const DEFAULT_FOLDER = "music"

function playMusic(bookmark) {
  let randIndex = Math.floor(Math.random()*(bookmark.length))
  let newTabId = null
  chrome.tabs.create({ url: bookmark[randIndex]['url'], active: false }, function(newTab) {
    newTabId = newTab.id
    chrome.tabs.update(newTabId,{active:true})
    //scroll down a little bit if it's nico site
    if(String(newTab.pendingUrl).includes("https://www.nicovideo")) {
      chrome.tabs.executeScript(newTab.id,{code:"window.scrollTo(0,500)"})
      waitTime = 3000
    }
    //need to triger video to play then go back to previous tab  
    window.setTimeout(( () => {
       chrome.tabs.update(tabFlg?curTabId:curTabId2,{active:true}) 
      }), waitTime);
    }
  )
}

function searchFolder(bookmarks, target) {
  for(let i = 0; i < bookmarks.length; i++) {
    let bookmark = bookmarks[i]
    if(bookmark.children) {
      if(bookmark.title == target) {
        playMusic(bookmark.children)
      }
      else {
        searchFolder(bookmark.children, target)
      }   
    }
  }
}

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.bookmarks.getTree(function(TreeNodes) {
    searchFolder(TreeNodes, DEFAULT_FOLDER)
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