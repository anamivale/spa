import { Feeds } from "./feeds.js"

export  function createComment(postid) {
    let content = document.getElementById("comment_content").value

const trimmedStr = content.trim();
if (trimmedStr === ""){
alert("You havent typed anything in the comment")
}
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
        if (data.message == "empty body"){
            alert("empty message body")
            Feeds()
        }
        if (data.message == "success"){
            Feeds()
        }
    })
    .catch(error =>{
        console.error(error.message)
        
})
    
}