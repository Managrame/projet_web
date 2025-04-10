"user strict";
import fs from 'fs/promises';//pour gèrer des fichiers
import Sqlite from "better-sqlite3"; //imporation better-sql
let db = new Sqlite("db.sqlite");
import express from "express";
let app=express();//importation express pour la gestion du serveur
app.use(express.urlencoded({ extended: true }));
import mustacheExpress from 'mustache-express';//importation  de mustache-express pour les templates
app.engine('html', mustacheExpress()); //configuration mustach-express
app.set('view engine', 'html');
app.set('views', './views');
import session from 'express-session';//importation  de express-session pour les sessions
app.use(express.static('public'));
// Configuration des sessions
app.use(session({
  secret: '314159',
  resave: false,
  saveUninitialized: false,
  cookie: { 
   
  }
}));


//fonction de manipulation de la base de données

function insert_licence(data) {
    const r = db.prepare("INSERT INTO licences (title, description) VALUES (@title, @description)").run({
        title: data.title,
        description: data.description
    });

    for (const key in data.ue) {
        if (data.ue.hasOwnProperty(key)) {
            const x = data.ue[key];

            var a = db.prepare("INSERT INTO ue (title, description, ects, vol_h, id_licence) VALUES (@title, @description, @ects, @vol_h, @id_licence)").run({
                title: x.title,
                description: x.description,
                ects: x.ects,
                vol_h: x.vol_h,
                id_licence: r.lastInsertRowid
            });

            for (const cle in x.quiz) {
               if (x.quiz.hasOwnProperty(cle)) {
                
               
                const y=x.quiz[cle]
            

            db.prepare("INSERT INTO quiz (enonce, option1, option2, option3, option4, solution, id_ue) VALUES (@enonce, @option1, @option2, @option3, @option4, @solution, @id_ue)").run({
                enonce: y.enonce,
                option1: y.options[0],
                option2: y.options[1],
                option3: y.options[2],
                option4: y.options[3],
                solution: y.solution,
                id_ue: a.lastInsertRowid
            });
        }
        }
    }
    }
}

function update_ue(id_ue,title,desc,ects,vol_h) {
    db.prepare("Update ue Set title=@title,description=@description,ects=@ects,vol_h=@vol_h where id= @id").run({
        id:id_ue,
        title:title,
        description:desc,
        ects:ects,
        vol_h:vol_h
    })
}

function update_quiz(id,enonce,o1,o2,o3,o4,s) {
    db.prepare("Update quiz Set enonce=@enonce,option1=@option1,option2=@option2,option3=@option3,option4=@option4,solution=@solution where id= @id").run({
        id:id,
        enonce:enonce,
        option1:o1,
        option2:o2,
        option3:o3,
        option4:o4,
        solution:s
    })
}

function insert_admin(n,p) {
    db.prepare("INSERT INTO admin (name,password) VALUES (@name,@password)").run({
        name:n,
        password:p
    });
}


async function lireJSON(file) {
    try {
        const contenu = await fs.readFile(file, 'utf-8'); // Lit le fichier
        const data = JSON.parse(contenu); // Convertit en objet
        return data;
    } catch (err) {
        console.error("Erreur de lecture :", err);
    }
}


async function load(file) {
    db.exec("DROP TABLE IF EXISTS quiz");
    db.exec("DROP TABLE IF EXISTS ue");
    db.exec("DROP TABLE IF EXISTS licences");
    db.exec("DROP TABLE IF EXISTS admin");

    db.exec(`CREATE TABLE IF NOT EXISTS admin(
        name TEXT PRIMARY KEY,
        password TEXT NOT NULL
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS licences(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL
    )`);
    
    db.exec(`CREATE TABLE IF NOT EXISTS ue(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        ects INTEGER NOT NULL,
        vol_h INTEGER NOT NULL,
        id_licence INTEGER NOT NULL,
        FOREIGN KEY (id_licence) REFERENCES licences(id)
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS quiz(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enonce TEXT NOT NULL,
        option1 TEXT NOT NULL,
        option2 TEXT NOT NULL,
        option3 TEXT NOT NULL,
        option4 TEXT NOT NULL,
        solution TEXT NOT NULL,
        id_ue INTEGER NOT NULL,
        FOREIGN KEY (id_ue) REFERENCES ue(id)
    )`);

    let data = await lireJSON(file);
    for (const key in data) {
        insert_licence(data[key]);
    }
}

//fonctions d'accès
function check_admin(name,pw){
    let a=db.prepare("Select name from admin").all();
    for (const id of a) {
         if ( id.name==name) {
        let b=db.prepare("Select password from admin where name=?").get(name).password;
        return b==pw;
    }
    }
   
    
        insert_admin(name,pw);
        return true;
    
}



function get_licence(id_licence) {
    // Récupération des infos de la licence avec un seul JOIN
    let licence = db.prepare(`
        SELECT 
            l.title AS licence_title, 
            l.description AS licence_description, 
            ue.id AS ue_id, 
            ue.title AS ue_title 
        FROM licences l
        LEFT JOIN ue ON ue.id_licence = l.id
        WHERE l.id = ?
    `).all(id_licence);

    // Si aucune licence trouvée, retourner null
    if (licence.length === 0) {
        return null;
    }

    // Construire l'objet de la licence
    let result = {
        title: licence[0].licence_title,
        description: licence[0].licence_description,
        ue: []
    };

    // Ajouter les UEs associées
    for (let row of licence) {
        if (row.ue_id) {
            result.ue.push({
                id: row.ue_id,
                title: row.ue_title
            });
        }
    }

    return result;
}


function get_all_licences() {
    let a = [];

    // Préparer la requête pour récupérer toutes les licences
    let licences = db.prepare("SELECT id, title FROM licences").all();

    // Construire le tableau de résultats
    for (let licence of licences) {
        a.push({
            id: licence.id,
            title: licence.title
        });
    }

    return a;
}

function get_ue(id_ue){
    let a=[];
    let q= db.prepare("Select id,enonce from quiz where id_ue=?").all(id_ue);//récupération des informations des quiz associés à l'ue
    for (let x of q) {
        a.push({
            id: x.id,
            enonce: x.enonce
        });
    }
    return {//construction de l'objet ue
        "id":id_ue,
        "title": db.prepare("Select title from ue where id=?").get(id_ue).title,
        "description": db.prepare("Select description from ue where id=?").get(id_ue).description,
        "ects": db.prepare("Select ects from ue where id=?").get(id_ue).ects,
        "vol_h": db.prepare("Select vol_h from ue where id=?").get(id_ue).vol_h,
        "quiz":a
    };
}

function get_quiz(id_question){
    return {
        "id":id_question,
        "enonce": db.prepare("Select enonce from quiz where id=?").get(id_question).enonce,
        "option1": db.prepare("Select option1 from quiz where id=?").get(id_question).option1,
        "option2": db.prepare("Select option2 from quiz where id=?").get(id_question).option2,
        "option3": db.prepare("Select option3 from quiz where id=?").get(id_question).option3,
        "option4": db.prepare("Select option4 from quiz where id=?").get(id_question).option4,
        "solution": db.prepare("Select solution from quiz where id=?").get(id_question).solution

    };
}

function check_sol(id_question, sol){
    let rep=db.prepare("Select solution from quiz where id=?").get(id_question);
    return (sol==rep.solution);
}

//fonctions d'affichage des pages

app.get("/",(req,res)=>{
    let al = get_all_licences();//tableau d'objet de la forme {id,name}
    res.render("index.html",{licences:al,session:req.session});
    }
);

app.get("/licence/:id",(req,res)=>{
    let l=get_licence(parseInt(req.params.id));
    res.render("licence.html",{ licence: l });
    }
);


app.get("/ue/:id",(req,res)=>{
    let u=get_ue(parseInt(req.params.id));
    res.render("ue",{ ue:u,session:req.session });
    }
);

app.get("/quiz/:id",(req,res)=>{
    let q=get_quiz(parseInt(req.params.id));
    res.render("quiz",{quiz:q,session:req.session});
    }
);


app.get("/connection",(req,res)=>{
    res.render("connection.html");
})

app.get("/logout",(req,res)=>{
    res.render("logout.html");
})


app.get("/update_ue/:id",(req,res)=>{
    let u=get_ue(parseInt(req.params.id));//récupération de l'ue de base pour préremplir les champs de la page de modification
    res.render("update_ue",{ue:u});
})

app.get("/update_quiz/:id",(req,res)=>{
    let u=get_quiz(parseInt(req.params.id));//récupération du quiz de base pour préremplir les champs de la page de modification
    res.render("update_quiz",{quiz:u});
})


//fonctions d'interaactons avec le serveur

app.post("/update_ue/:id",(req,res)=>{
    update_ue(parseInt(req.params.id),req.body.title,req.body.description,parseInt(req.body.ects),parseInt(req.body.vol_h));
    res.redirect("/");
})

app.post("/update_quiz/:id",(req,res)=>{
    update_quiz(parseInt(req.params.id),req.body.enonce,req.body.option1,req.body.option2,req.body.option3,req.body.option4,req.body.solution);
    res.redirect("/");
})

app.post("/connection",(req,res)=>{
    let a=check_admin(req.body.username,req.body.password);
    if (a) {
       req.session.authenticated =true;
        res.redirect("/");
    }
    else{
        res.redirect("/connection");
    }
})

app.post("/logout",(req,res)=>{
    req.session.destroy(err => {
        if (err) {
            console.error("Erreur de déconnexion:", err);
        }
        res.redirect("/");
    });
})

app.post("/quiz/:id",(req,res)=>{
    console.log(req.body.choice);
    let q=check_sol(parseInt(req.params.id), req.body.choice);
    if(q){
        res.render("sol.html",{solution:true,id:parseInt(req.params.id)});
    }
    else{
        res.render("sol.html",{solution:false,id:parseInt(req.params.id)});
    }
    }
);

//lancement
load("./proto.json").then(() => {//création de la base puis lancement du serveur
    app.listen(3000, () => {
        console.log("Server is running on http://localhost:3000");
    });
});