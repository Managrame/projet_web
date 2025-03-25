"user strict";
let Sqlite=require("better-sqlite3"); //imporation better-sql
let db = new Sqlite("db.sqlite");
let express =require("express");
let app=express();
let mustache = require('mustache-express');
app.engine('html', mustache()); 
app.set('view engine', 'html');
app.set('views', './views');

function get_licence(id_licence){
    let a={};
    let title=db.prepare("Select title from licence where id=?");
    a["title"]=title.run(id_licence);
    let des=db.prepare("Select description from licence where id=?");
    a["description"]=des.run(id_licence);
    let u=[];
    let i =db.prepare("Select id from ue where id_licence=?").run(id_licence).all();
    for (const x in i) {
        let ue ={};
        ue["id"]=x;
        ue["title"]=db.prepare("Select title from ue where id=?").run(x);
        u.push(ue);
    }
    a["ue"]=u;
    return a;
}

function get_all_licences(){
    let a=[];
    let i=db.run("Select id from licences").all();
    const find_name=db.prepare("Select title From licences Where id=?");
    for (const x in i) {
        let b={};
        b["id"]=x;
        b["title"]=find_name.run(x);
        a.push(b);
    }
    return a;
}

function get_ue(id_ue){
    let a={};
    let title=db.prepare("Select title from ue where id=?");
    a["title"]=title.run(id_ue);
    let des=db.prepare("Select description from ue where id=?");
    a["description"]=des.run(id_ue);
    let e=db.prepare("Select ects from ue where id=?");
    a["ects"]=e.run(id_ue);
    let v=db.prepare("Select vol_h from ue where id=?");
    a["vol_h"]=v.run(id_ue);
    let q=db.prepare("Select id from quiz where id_ue=?");
    a["question_id"]=q.run(id_ue);
    return a;
}

function get_quiz(id_question){
    let a={}
    let e=db.prepare("Select enonce from quiz where id=?");
    a["enonce"]=e.run(id_question);
    let o1=db.prepare("Select option1 from quiz where id=?");
    a["option1"]=o1.run(id_question);
    let o2=db.prepare("Select option2 from quiz where id=?");
    a["option2"]=o2.run(id_question);
    let o3=db.prepare("Select option3 from quiz where id=?");
    a["option3"]=o3.run(id_question);
    let o4=db.prepare("Select option4 from quiz where id=?");
    a["option4"]=o4.run(id_question);
    return a;
}

function check_sol(id_question, sol){
    let rep=db.prepare("Select solution from quiz where id=?");
    if (sol==rep.run(id_question)) {
        return true;
    }
    else{
        return false;
    }
}

app.get("/",(req,res)=>{
    let al = get_all_licences();
    res.render("index.html",al);
    }
);

app.get("/licence/:id",(req,res)=>{
    let l=get_licence(parseInt(req.params.id));
    res.render("licence.",{ licence: l });
    }
);


app.get("/ue/:id",(req,res)=>{
    let u=get_ue(parseInt(req.params.id));
    res.render("ue",{ ue: u });
    }
);

app.get("/quiz/:id",(req,res)=>{
    let q=get_quiz(parseInt(req.params.id));
    res.render("quiz",{quiz,q});
    }
);

app.post("/quiz/:id",(req,res)=>{
    let q=check_sol(parseInt(req.params.id), req.form.choice);
    if(q==true){
        res.send("bonne reponse");
        
    }
    else{
        res.send("faux");
        res.redirect("/quiz/:id");
    }
    }
);