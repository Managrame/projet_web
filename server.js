"user strict";
import Sqlite from "better-sqlite3"; //imporation better-sql
let db = new Sqlite("db.sqlite");
import express from "express";
let app=express();
import mustacheExpress from 'mustache-express';
app.engine('html', mustacheExpress()); 
app.set('view engine', 'html');
app.set('views', './views');


db.exec(`CREATE TABLE IF NOT EXISTS licences(
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title Varchar2(10) not NULL,
     description  Varchar2(10) not NULL
)`);


db.exec(`CREATE TABLE IF NOT EXISTS ue(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title Varchar2(10) not NULL,
    description  Varchar2(10) not NULL,
    ects INTEGER not NUL,
    vol_h INTEGER not NUL,
    id _licence INTEGER not NULL,
    FOREIGN KEY (id_licence) REFERENCES licences(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS quiz(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enonce VArchar2(10) not NULL,
    option1 VArchar2(10) not NULL,
    option2 VArchar2(10) not NULL,
    option3 VArchar2(10) not NULL,
    option4 VArchar2(10) not NULL,
    solution VArchar2(10) not NULL,
    id_ue INTEGER not NULL,
    FOREIGN KEY (id_ue) REFERENCES ue(id)
)`);








function get_licence(id_licence){
    let a={};
    let title=db.prepare("Select title from licences where id=?");
    a["title"]=title.get(id_licence);
    let des=db.prepare("Select description from licences where id=?");
    a["description"]=des.get(id_licence);
    let u=[];
    let i =db.prepare("Select id from ue where id_licence=?").all(id_licence);
    for (var x of i) {
        let ue ={};
        ue["id"]=x;
        ue["title"]=db.prepare("Select title from ue where id=?").get(x);
        u.push(ue);
    }
    a["ue"]=u;
    return a;
}

function get_all_licences(){
    let a=[];
    let i=db.run("Select id from licences").all();
    const find_name=db.prepare("Select title From licences Where id=?");
    for (var x of i) {
        let b={};
        b["id"]=x;
        b["title"]=find_name.get(x);
        a.push(b);
    }
    return a;
}

function get_ue(id_ue){
    return {
        "title": db.prepare("Select title from ue where id=?").get(id_ue),
        "description": db.prepare("Select description from ue where id=?").get(id_ue),
        "ects": db.prepare("Select ects from ue where id=?").get(id_ue),
        "vol_h": db.prepare("Select vol_h from ue where id=?").get(id_ue),
        "question_id": db.prepare("Select id from quiz where id_ue=?").get(id_ue)
    };
}

function get_quiz(id_question){
    return {
        "enonce": db.prepare("Select enonce from quiz where id=?").get(id_question),
        "option1": db.prepare("Select option1 from quiz where id=?").get(id_question),
        "option1": db.prepare("Select option2 from quiz where id=?").get(id_question),
        "option1": db.prepare("Select option3 from quiz where id=?").get(id_question),
        "option1": db.prepare("Select option4 from quiz where id=?").get(id_question)
    };
}

function check_sol(id_question, sol){
    let rep=db.prepare("Select solution from quiz where id=?");
    return (sol==rep.get(id_question));
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
    if(q){
        res.send("bonne reponse");
    }
    else{
        res.send("faux");
    }
    }
);