let curTabId = null
let curTabId2 = null
let newTabId = 0
let tabFlg = true
let waitTime = 1000
const DEFAULT_FOLDER = "music"

function newTabCallback(newTab) {
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

function playMusic(bookmark) {
  let randIndex = Math.floor(Math.random()*(bookmark.length))

  //check if the tab already exist, if exist update else create new tab
  chrome.tabs.get(newTabId, ()=>{
    if (chrome.runtime.lastError) {
      chrome.tabs.create({ url: bookmark[randIndex]['url'], active: false }, newTabCallback)
    } 
    else {
      //detect if current on the music play tab => if yes change the flag
      if((newTabId == curTabId2 && tabFlg)||(newTabId == curTabId && !tabFlg)){
        tabFlg = !tabFlg
      }
      chrome.tabs.update(newTabId, {url: bookmark[randIndex]['url']}, newTabCallback)
    }
  })
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
//prevent prerendering to cause tabID changing
chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
  if(removedTabId == newTabId) {
    newTabId = addedTabId
  }
})