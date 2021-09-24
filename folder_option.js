let root_folder = document.getElementById("root_folder")

// console.log("mumi")
let test_ele = document.getElementById("test")
chrome.bookmarks.getTree(function (TreeNodes) {
    createDynamicList(TreeNodes[0], test_ele)
})



function createDynamicList(node, htmlParent) {
    //check if it is directory
    if(node.hasOwnProperty("children")) {
        let child_list = document.createElement("ul")
        for(let i = 0; i < node.children.length; i++) {
            let child = document.createElement("li")
            child.textContent =  node.children[i].title
            child_list.appendChild(child)
        }
        htmlParent.appendChild(child_list)
    }
}
