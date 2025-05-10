import { Feeds } from "./feeds.js"

export  function createComment(postid) {
    let content = document.getElementById("comment_content").value

    let req = {
        "post_id": postid,
        "content":content
        
    }

    fetch("/comment", {
        method: "POST",
        headers :{
            "content-type": "application/json"
        },
        body : JSON.stringify(req)
    })
    .then(res => res.json())
    .then(data =>{
        if (data.message == "success"){
            Feeds()
        }
    })
    .catch(error =>{
        console.error(error.message)
        
})
    
}