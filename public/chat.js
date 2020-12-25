"use strict";

document.addEventListener("DOMContentLoaded", function(_e) {

    // socket ouverte vers le client
    var sock = io.connect();
    
    // utilisateur courant 
    var currentUser = null;
    
    // tous les utilisateurs (utile pour la complétion) 
    var users = [];

    class player{
        constructor(color, name, id, score){
            this.color = color;
            this.name = name;
            this.id = id;
            this.score = score;
        }
    }
    
    class sv_partie {   // classe définissant une partie de stupide vautour coté client
        constructor (id) {
            this.cards = new Array;
            this.play = null;
            this.mid = new Array;
            var rad = document.createElement("input");
            rad.type = "radio";
            rad.name = "btnSvautour";
            rad.id = id + "-radio";
            rad.checked = true;
            document.body.appendChild(rad);
            this.game = document.createElement("div");
            this.game.id = id;
            this.game.classList.add("game");
            if(sessionStorage.getItem("Background") == "Black"){
                this.game.classList.add("dark");
                set_background();
            }
            document.body.appendChild(this.game);
            this.mid_img = new Array;
            this.players = new Array;
            this.nextid = 0
            this.current_mid = new Array;
        }
    }


    if(sessionStorage.getItem("Background") == null ){
        sessionStorage.setItem("Background","White");
    }
    var fr_eng = { "rouge" : "red", "vert" : "green", "jaune" : "yellow", "violet" : "purple", "bleu" : "blue"};
    var games = {}; // Gestion des parties games[id].game
    var colors = ["rouge", "violet", "vert", "bleu", "jaune"]; // fr_eng["bleu"] == "blue"
    
    // tous les caractères spéciaux (utile pour les remplacements et la complétion) 
    var specialChars = {
        ":paper:": "&#9995;",
        ":rock:": "&#9994;",
        ":scissors:": "&#x270C;",
        ":lizard:": "&#129295;",
        ":spock:": "&#128406;",
        ":smile:": "&#128578;",
        ":sad:": "&#128577;",
        ":laugh:": "&#128512;",
        ":wink:": "&#128521;",
        ":love:": "&#129392;",
        ":coeur:": "&#10084;",
        ":bisou:": "&#128536;",
        ":peur:": "&#128561;",
        ":whoa:": "&#128562;",
        ":mask:" : "&#128567;"
    }

    // réception du message de bienvenue
    sock.on("bienvenue", function(liste) {    
        if (currentUser) {
            // on change l'affichage du bouton
            document.getElementById("btnConnecter").value = "Se connecter";
            document.getElementById("btnConnecter").disabled = false;
            // on vide les zones de saisie
            document.querySelector("#content main").innerHTML = "";
            document.getElementById("monMessage").value = "";
            document.getElementById("login").innerHTML = currentUser;
            document.getElementById("radio2").checked = true;
            document.getElementById("monMessage").focus();
            afficherListe(liste);
        }
    });
    // réception d'une erreur de connexion
    sock.on("erreur-connexion", function(msg) {
        alert(msg);   
        document.getElementById("btnConnecter").value = "Se connecter";
        document.getElementById("btnConnecter").disabled = false;
    });
    
    // réception d'un message classique
    sock.on("message", function(msg) {
        if (currentUser) {
            //show_game();
            afficherMessage(msg);
        }
    });
    // réception de la mise à jour d'une liste
    sock.on("liste", function(liste) {
        if (currentUser) {
            afficherListe(liste);
        }
    });
    
    // réception d'un défi
    sock.on("chifoumi", function(adversaire) {
        // petit effet spécial (class "buzz" à ajouter pour faire vibrer l'affichage)
        document.getElementById("content").classList.add("buzz");
        setTimeout(function() {
            document.getElementById("content").classList.remove("buzz");
        }, 500);
        
        var btnRepondre = document.createElement("button");
        btnRepondre.innerHTML = "lui répondre";
        btnRepondre.addEventListener("click", function() { initierDefi(adversaire); });
        var p = document.createElement("p");
        p.classList.add("chifoumi");
        p.innerHTML = (new Date()).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }).substr(13, 8) + 
                        " - [chifoumi] : " + adversaire + " te défie à Rock-Paper-Scissors-Lizard-Spock ";     
        p.appendChild(btnRepondre);
        document.querySelector("#content main").appendChild(p);
    });
    
    // gestion des déconnexions de la socket --> retour à l'accueil
    sock.on("disconnect", function(reason) {
        for(var key in games){
            sock.emit("sv", {id : key, pseudo : currentUser, option : 4});
        }
        close_game(true);
        currentUser = null;
        document.getElementById("radio1").checked = true;
        document.getElementById("pseudo").focus();
    });
    
    /** 
     *  Connexion de l'utilisateur au chat.
     */
    function connect() {
        // recupération du pseudo
        var user = document.getElementById("pseudo").value.trim();
        if (! user) return;
        currentUser = user; 
        // ouverture de la connexion
        sock.emit("login", user);
        document.getElementById("btnConnecter").value = "En attente...";
        document.getElementById("btnConnecter").disabled = true;
    }

    /** 
     *  Affichage des messages 
     *  @param  object  msg    { from: auteur, text: texte du message, date: horodatage (ms) }
     */
    function afficherMessage(msg) {
        // si réception du message alors que l'on est déconnecté du service
        if (!currentUser) return;   
        
        // affichage des nouveaux messages 
        var bcMessages = document.querySelector("#content main");

        // identification de la classe à appliquer pour l'affichage
        var classe = "";        

        // cas des messages privés 
        if (msg.from != null && msg.to != null && msg.from != 0) {
            classe = "mp";  
            if (msg.from == currentUser) {
                msg.from += " [privé @" + msg.to + "]";   
            }
            else {
                msg.from += " [privé]"
            }
        }
        
        // cas des messages ayant une origine spécifique (soi-même ou le serveur)
        if (msg.from == currentUser) {
            classe = "moi";   
        }
        else if (msg.from == null) {
            classe = "system";
            msg.from = "[admin]";
        }
        else if (msg.from === 0) {
            classe = "chifoumi";
            msg.from = "[chifoumi]";
        }

        if(document.getElementById("son_on").checked){
            playText("De : " + msg.from + msg.text, 1);
        }
        
        // affichage de la date format ISO pour avoir les HH:MM:SS finales qu'on extrait ensuite
        var date = new Date(msg.date);
        date = date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }).substr(13, 8);
        // remplacement des caractères spéciaux par des émoji
        msg.text = traiterTexte(msg.text);
        // affichage du message
        bcMessages.innerHTML += "<p class='" + classe + "'>" + date + " - " + msg.from + " : " + msg.text + "</p>"; 
        // scroll pour que le texte ajouté soit visible à l'écran
        document.querySelector("main > p:last-child").scrollIntoView();
    };
    
    // traitement des emojis
    function traiterTexte(txt) {
        // remplacement de quelques smileys par les :commandes: correspondantes
        txt = txt.replace(/:[-]?\)/g,':smile:');
        txt = txt.replace(/:[-]?[Dd]/g,':laugh:');
        txt = txt.replace(/;[-]?\)/g,':wink:');
        txt = txt.replace(/:[-]?[oO]/g,':whoa:');
        txt = txt.replace(/:[-]?\*/g,':bisou:');
        txt = txt.replace(/<3/g,':coeur:');
        // remplacement des :commandes: par leur caractère spécial associé 
        for (let sp in specialChars) {
            txt = txt.replace(new RegExp(sp, "gi"), specialChars[sp]);   
        }
        return txt;   
    }

    /**
     *  Affichage de la liste de joueurs.
     */
    function afficherListe(newList) {
        // liste des joueurs
        users = Object.keys(newList);
        // tri des joueurs en fonction de leur classement
        users.sort(function(u1, u2) { return newList[u2] - newList[u1]; });
        // affichage en utilisant l'attribut personnalisé data-score
        document.querySelector("#content aside").innerHTML = 
            users.map(u => "<p data-score='" + newList[u] + "'>" + u + "</p>").join("");
    }

    /**
     *  Envoi d'un message : 
     *      - Récupération du message dans la zone de saisie.
     *      - Identification des cas spéciaux : @pseudo ... ou /chifoumi @pseudo :choix:
     *      - Envoi au serveur via la socket
     */ 
    function envoyer() {
        
        var msg = document.getElementById("monMessage").value.trim();
        if (!msg) return;   

        // Cas des messages privés
        var to = null;
        if (msg.startsWith("@")) {
            var i = msg.indexOf(" ");
            to = msg.substring(1, i);
            msg = msg.substring(i);
        }
        
        // Cas d'un chifoumi
        if (msg.startsWith("/chifoumi")) {
            var args = msg.split(" ").filter(e => e.length > 0);
            if (args.length < 3) {
                afficherMessage({from: null, text: "Usage : /chifoumi @adversaire :choix:", date: Date.now() });
                return;
            }
            if (args[1].charAt(0) != "@") {
                afficherMessage({from: null, text: "Le second argument doit être le nom de l'adversaire précédé de @", date: Date.now() });
                return;
            }
            to = args[1].substr(1);
            if (to == currentUser) {
                afficherMessage({from: null, text: "Il est impossible de se défier soi-même !", date: Date.now() });
                return;
            }
            if ([":rock:", ":scissors:", ":paper:", ":lizard:", ":spock:"].indexOf(args[2]) < 0) {
                afficherMessage({from: null, text: "Le troisième argument est incorrect.", date: Date.now() });
                return;
            }
            sock.emit("chifoumi", { to: to, choice: args[2] });
        }
        else if(msg.startsWith("/svautour")){
            create_lobby(msg);
        }
        else {
            // envoi
            sock.emit("message", { to: to, text: msg });
        }
        // enregistrement de la commande dans l'historique
        historique.ajouter();
        // effacement de la zone de saisie
        document.getElementById("monMessage").value = "";
    }

    function initierDefi(adversaire) {
        document.getElementById("monMessage").value = "/chifoumi @" + adversaire + " :";
        document.getElementById("monMessage").focus();
        completion.reset();
    }
    
    /**
     *  Quitter le chat et revenir à la page d'accueil.
     */
    function quitter() { 
        if (confirm("Quitter le chat ?")) {
            close_game(true);
            currentUser = null;
            sock.emit("logout");
            document.getElementById("radio1").checked = true;
        }
    };    

    // Objet singleton gérant l'auto-complétion
    var completion = {
        // le texte de base que l'on souhaite compléter
        text: null,
        // l'indice de la proposition courant de complétion
        index: -1,
        // la liste des propositions de complétion
        props: [],
        // remise à zéro
        reset: function() {
            this.text = null;
            this.index = -1;
        },
        // calcul de la proposition suivante et affichage à l'emplacement choisi
        next: function() {
            if (this.text === null) {
                this.text = document.getElementById("monMessage").value;
                this.props = this.calculePropositions();
                this.text = this.text.substring(0, this.text.lastIndexOf(":"));
                this.index = -1;
                if (this.props.length == 0) {
                    this.text = null;
                    return;
                }
            }
            this.index = (this.index + 1) % this.props.length;
            document.getElementById("monMessage").value = this.text + this.props[this.index];   
        },
        // calcul des propositions de compétion
        calculePropositions: function() {
            var i = this.text.lastIndexOf(":");
            if (i >= 0) { 
                var prefixe = this.text.substr(i);
                return Object.keys(specialChars).filter(e => e.startsWith(prefixe));
            }
            return [];
        }
    };
    
    // Objet singleton gérant l'historique des commandes saisies
    var historique = {
        // contenu de l'historique
        content: [],
        // indice courant lors du parcours
        index: -1,
        // sauvegarde de la saisie en cour
        currentInput: "",
        
         precedent: function() {
            if (this.index >= this.content.length - 1) {
                return;
            }
            // sauvegarde de la saisie en cours
            if (this.index == -1) {
                this.currentInput = document.getElementById("monMessage").value;
            }
            this.index++;
            document.getElementById("monMessage").value = this.content[this.index];
            completion.reset();
        },
        suivant: function() {
            if (this.index == -1){
                return;
            }
            this.index--;
            if (this.index == -1) {
                document.getElementById("monMessage").value = this.currentInput;
            }
            else{
                document.getElementById("monMessage").value = this.content[this.index];
            }
            completion.reset();
        },
        ajouter: function() {
            this.content.splice(0, 0, document.getElementById("monMessage").value);
            this.index = -1;
        }
    }
    
    /** 
     *  Mapping des boutons de l'interface avec des fonctions du client.
     */
    document.getElementById("btnConnecter").addEventListener("click", connect);
    document.getElementById("btnQuitter").addEventListener("click", quitter);
    document.getElementById("btnEnvoyer").addEventListener("click", envoyer);
    
    /**
     *  Ecouteurs clavier
     */
    document.getElementById("pseudo").addEventListener("keydown", function(e) {
        if (e.key == "Enter") // touche entrée
            connect();
    });
    document.getElementById("monMessage").addEventListener("keydown", function(e) {
        switch (e.key) {
            case "Tab" : // tabulation
                e.preventDefault();     // empêche de perdre le focus
                completion.next();
                break;
            case "ArrowUp" :   // fleche haut
                e.preventDefault();     // empêche de faire revenir le curseur au début du texte
                historique.precedent();
                break;
            case "ArrowDown" :   // fleche bas
                e.preventDefault();     // par principe
                historique.suivant();
                break;
            case "Enter" :   // touche entrée
                envoyer();
            default: 
                completion.reset();
        }
    });
    document.querySelector("#content aside").addEventListener("dblclick", function(e) {
        if (e.target.tagName == "P") {
            initierDefi(e.target.innerHTML);
        }
    });
    
    // Au démarrage : force l'affichage de l'écran de connexion
    document.getElementById("radio1").checked = true;
    document.getElementById("pseudo").focus();

    /*******************************************************
     ************************ PROJET ***********************
     *******************************************************/

    /**
     * Permet de dire un message avec la synthèse vocale
     * 
     * @param {string} text     Le message voulu
     * @param {int} spd         La vitesse de parole
     */
    function playText(text, spd){ // playText("Bonjour", 2);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = spd;
        speechSynthesis.speak(utterance);
    }

    /**
     * Permet de montrer toutes les cartes à l'utilisateur
     * 
     * @param {int} id      L'id de la partie
     */
    function show_user_card(id){
        var size = 0;
        for(var i = 0; i < games[id].cards.length; i++){
            if(games[id].cards[i] != undefined){
                size++;
            }
        }
        //console.log(size);
        var width = window.innerWidth / 2 - ( (window.innerWidth / 2) / size) - 60;
        var curr = 10;
        for(var i = 0; i < games[id].cards.length; i++){
            if(games[id].cards[i] != undefined){
                games[id].cards[i].style.left = curr + "px";
                curr += width/size;
            }
        }
    }

    /**
     * permet de faire l'affichage graphique de la partie indiquée par l'id
     * 
     * @param {int} id      L'id de la partie
     */
    function init_middle(id){ // A REFAIRE !!!!!!!!!!!!
        // TODO ADD IMG RETOURNEé
        var mid = new Array;
        var path = "./img/middle/";
        var local = 0;
        for(var i = -5; i <= 10; i++){
            if(i!=0){
                try{throw(local)}
                catch(ii){
                    var img = document.createElement("img");
                    mid[ii] = img
                    mid[ii].src = path + i + ".png";
                    mid[ii].alt = i;
                }
                local++;
            }
        }
        var m = document.createElement("div");
        m.id = id + "mid";
        m.className = "middle";
        document.getElementById(id + "plt").appendChild(m);
        games[id].mid_img = mid;
    }

    /**
     * Permet de donner les couleurs prises par les joueurs d'une partie
     * 
     * @param {int} id      L'id de la partie
     */
    function get_player_color(id){
        for(var i = 0; i < games[id].players.length; i++){
            if(games[id].players[i].name == currentUser){
                //console.log("COULEUR " + games[id].players[i].color);
                return games[id].players[i].color;
            }
        }
        return "rouge"; // en cas d'erreur
    }

    /**
     * Permet de donner les scores des joueurs d'une partie
     * 
     * @param {int} id      L'id de la partie
     */
    function get_player_score(id){
        for(var i = 0; i < games[id].players.length; i++){
            //console.log(games[id].players[i].name + " / " + currentUser);
            if(games[id].players[i].name == currentUser){
                //console.log("SCORE " +games[id].players[i].score);
                return games[id].players[i].score;
            }
        }
        return 0; // en cas d'erreur
    }

    /**
     * Permet d'initialiser et d'afficher la main d'un joueur (avec la couleur adaptée)
     * @param {string} color     la couleur du joueur
     * @param {int} id      L'id de la partie
     */
    function init_hand(color, id){
        var player_hand = document.getElementById(id + "plh");
        if(player_hand == undefined){
            player_hand = document.createElement("div");
            player_hand.className = "player-hand";
            player_hand.id = id + "plh"; // exemple : 0plh ou 2plh 
        }
        player_hand.innerHTML = '';
        var cards = new Array;
        var path = "./img/" + color + "/";
        for(var i = 1; i <= 15; i++){
            try{throw(i)}
            catch(ii){
                var img = document.createElement("img");
                cards[ii-1] = img
                player_hand.appendChild(cards[ii-1]);
                cards[ii-1].className = "cartes";
                cards[ii-1].src = path + ii + ".png";
                cards[ii-1].alt = ii;
                cards[ii-1].addEventListener("click", function(e){
                    //const index = cards.indexOf(this);
                    //console.log(ii);
                    sock.emit("sv", {from : currentUser, id : id, card : ii, option : 3});
                });
            }
        }
        var scr = document.createElement("p");
        scr.style.color = fr_eng[get_player_color(id)];
        scr.innerHTML = "Score " + get_player_score(id);
        scr.id = id + "score_pl";
        player_hand.appendChild(scr);
        games[id].game.appendChild(player_hand);
        games[id].cards = cards;
    }

    /**
     * Permet d'afficher les autres joueurs de la partie (ordre spécial car ne fonctionne pas autrement)
     * 
     * @param {int} id      L'id de la partie
     */
    function show_players(id){
        var plateau = document.getElementById(id + "plt");
        for(var i = 1; i < 5; i++){ // i va de 1 à 4
            var y = 0;
            switch(i){
                case 1:
                    y = 3
                    break;
                case 2:
                    y = 1
                    break;
                case 3:
                    y = 2
                    break;
                case 4:
                    y = 4
                    break; 
            }
            var joueur = document.createElement("div");
            joueur.id = id + "-j" + y; // exemple d'id : 0-j1
            joueur.className = "j" + y;
            plateau.appendChild(joueur);
        }
        update_players(id)
    }

    /**
     * Permet d'afficher aux joueurs la/les carte(s) en jeu au milieu
     * 
     * @param {int} id      L'id de la partie
     */
    function show_mid(id){
        var path = "./img/middle/";
        var decalage = 0;
        //console.log(games[id].current_mid);
        var scr = 0;
        document.getElementById(id + "mid").innerHTML = ''; // On reset le milieux pour y afficher l'image(s)
        for(var i = 0; i < games[id].current_mid.length; i++){
            var img = document.createElement("img");
            img.src = path + games[id].current_mid[i] + ".png";
            img.alt = games[id].current_mid[i];
            img.style.top += decalage + "px";
            if(decalage < 60){
                decalage += 60;
            }
            document.getElementById(id + "mid").appendChild(img);
            scr += games[id].current_mid[i];
        }
        var tot = document.createElement("p");
        tot.innerHTML = "Total " + scr;
        decalage += 200;
        tot.style.top = decalage + "px";
        document.getElementById(id + "mid").appendChild(tot);
    }

    /**
     * Permet d'update visuelement le menu pour les joueurs
     */
    function update_menu(){
        var dp_content = document.getElementById("dpc");
        dp_content.innerHTML = "";
        for(var id in games){
            try{throw(id)}
            catch(idd){
                var a = document.createElement("a");
                a.href = "#p" + idd;
                a.id = "mchoice" + idd; 
                a.innerHTML = "Partie " + idd + "<br><br>";
                a.addEventListener("click", function(){
                    //console.log(idd);
                    document.getElementById(idd + "-radio").checked = true;
                })
                dp_content.appendChild(a);
            }
        }
    }

    /**
     * Permet de créer le menu pour les joueurs
     */
    function create_menu(){
        var drop = document.createElement("div");
        //drop.className = "dropdown";
        drop.id = "dropdown";
        var sp = document.createElement("span");
        sp.innerHTML = "Parties \\/";
        drop.appendChild(sp);
        var dp_content = document.createElement("div");
        dp_content.className = "dropdown-content";
        dp_content.id = "dpc";
        for(var id in games){
            try{throw(id)}
            catch(idd){
                var a = document.createElement("a");
                a.href = "#p" + idd;
                a.id = "mchoice" + idd; 
                a.innerHTML = "Partie " + idd + "<br><br>";
                a.addEventListener("click", function(){
                    //console.log(idd);
                    document.getElementById(idd + "-radio").checked = true;
                })
                dp_content.appendChild(a);
            }
        }
        drop.appendChild(dp_content);
        document.body.appendChild(drop);
    }

    /**
     * Permet d'afficher les joueurs de la partie id
     * 
     * @param {int} id      L'id de la partie
     */
    function update_players(id){
        for(var i = 0; i < games[id].players.length; i++){
            if(games[id].players[i].name != currentUser){
                var player_id = games[id].players[i].id;
                var joueur = document.getElementById(id + "-j" + player_id);
                joueur.innerHTML = ''; // On reset l'affichage pour le refaire avec le score à jour
                //console.log("id : " + id + "-j" + player_id);
                joueur.innerHTML = '';
                var nme = document.createElement("p");
                nme.style.color = fr_eng[games[id].players[i].color];
                //console.log(fr_eng[games[id].players[i].color]);
                var scr = document.createElement("p");
                scr.innerHTML = "Score " + games[id].players[i].score;
                scr.style.color = fr_eng[games[id].players[i].color];
                nme.innerHTML = games[id].players[i].name;
                joueur.appendChild(nme);
                joueur.appendChild(scr);
            }
        }
        var scr_pl = document.getElementById(id + "score_pl");
        scr_pl.innerHTML= "Score " + get_player_score(id);
    }

    /**
     * Permet de créer le menu du jeu s'il n'existe pas, ou bien de l'actualiser
     * 
     * @param {string} col      La couleur du joueur
     * @param {int} id          L'id de la partie
     */
    function show_game(col, id){
        if(Object.keys(games).length > 1){
            update_menu();
        }else{
            create_menu();
        }
        document.getElementById("content").classList.remove("back_move");
        document.getElementById("content").classList.add("move");
        var plateau = document.createElement("div");
        plateau.className = "plateau";
        plateau.id = id + "plt";
        games[id].game.appendChild(plateau);
        var menu = document.createElement("div");
        menu.id = "menu";
        games[id].game.appendChild(menu);
        //games[id].game.style.display = "block";
        //games[id].game.classList.remove("disappear");
        games[id].game.classList.add("appear");
        if(document.getElementById("son_on").checked){
            playText("Et c'est parti pour une game endiablé de Stupide vautour mon gars!", 1.3);
        }
        init_hand(col, id); // TODO Demander la couleur que le joueur souhaite en fonction de ce qu'il reste
        show_user_card(id);
        init_middle(id);
        show_players(id);
        
        var left_but = document.createElement("button");
        left_but.className = "leftbut";
        //left_but.innerHTML = "Quitter";
        left_but.addEventListener("click", function() {
            sock.emit("sv", {id : id, pseudo : currentUser, option : 4});
            afficherMessage({from: null, text: "Vous venez de quitter la partie numéro : " + id, date: Date.now() });
            close_game(false);
        });
        menu.appendChild(left_but);
    }

    /**
     * Permet au joueur de quitter une partie et de la faire partir de son écran
     * 
     * @param {boolean} leave   
     */
    function close_game(leave){
        var id = "bad";
        for(var k in games){
            if(document.getElementById(k + "-radio").checked){
                id = k;
                break;
            }
        }
        if(id != "bad"){
            if(Object.keys(games).length == 1){
                document.body.removeChild(document.getElementById("dropdown"));
            }else{
                var last = document.getElementById("mchoice" + id);
                var sec = document.getElementById("dpc");
                sec.removeChild(last);
            }
            if(leave){
                for(var key in games){ // On affiche la partie suivante s'il y en a une
                    delete games[key];
                    document.body.removeChild(document.getElementById(key));
                    document.body.removeChild(document.getElementById(key + "-radio"));
                }
            }else{
                games[id].game.classList.remove("appear");
                games[id].game.classList.add("disappear");
                setTimeout(function() {
                    document.getElementById(id + "-radio").checked = false;
                    delete games[id]; // On supprime la partie (le code HTML avec)
                    document.body.removeChild(document.getElementById(id));
                    document.body.removeChild(document.getElementById(id + "-radio"));
                    var check = true;
                    for(var key in games){ // On affiche la partie suivante s'il y en a une
                        document.getElementById(key + "-radio").checked = true;
                        check = false;
                        break;
                    }
                    if(check){
                        document.getElementById("content").classList.remove("move");
                        document.getElementById("content").classList.add("back_move");
                    }
                }, 500);
            }
        }
    }

    /**
     * Permet de créer un lobby qui correspond aux arguments dans la commande, mais aussi d'indiquer des erreurs de syntaxe ou bien les règles du jeu
     * 
     * @param {string} command  La commande indiquée, plus tard split par des espaces
     */
    function create_lobby(command){
        //Commande codée : /svautour [opt] [nbTours] [couleur] [pseudo...]
        var args = command.split(" ").filter(e => e.length > 0);
        if(args[1] == "start"){
            // Lance la partie, côté serveur il faut vérifier que la personne qui lance
            // la commande est bien le créateur de la partie
            if(args.length == 3){
                var curr_id = parseInt(args[2]);
                if(!curr_id && curr_id != 0){
                    afficherMessage({from: null, text: "Erreur : Vous devez choisir un ID.<br>Utilisation : /svautour start [id]", date: Date.now() });
                }
                else{
                    sock.emit("sv", {id : curr_id, from : currentUser, option : 2});
                }
            }
            else{
                afficherMessage({from: null, text: "Erreur : Il n'y a pas le bon nombre de paramètres.<br>Utilisation : /svautour start [id]", date: Date.now() });

            }
        }
        else if(args[1] == "create"){ // création d'une partie
            var nb_turns = parseInt(args[2]);
            var choose_color = args[3];
            if(!nb_turns){ // Si le premier argument n'est pas un nombre
                afficherMessage({from: null, text: "Erreur : Vous devez spécifier un nombre de tours dans la commande.<br>Utilisation : /svautour create [nbTours] [couleur] [pseudo...]", date: Date.now() });
                return;
            }
            else if (nb_turns < 1){ // Nombre de parties nul ou négatif
                afficherMessage({from: null, text: "Erreur : La partie ne peut pas durer moins d'un tour.<br>Utilisation : /svautour create [nbTours] [couleur] [pseudo...]", date: Date.now() });
                return;
            }
            else if (nb_turns > 5){ // Nombre de parties supérieur à 5
                afficherMessage({from: null, text: "Erreur : La partie ne peut pas durer plus de 5 tours.<br>Utilisation : /svautour create [nbTours] [couleur] [pseudo...]", date: Date.now() });
                return;
            }
            else if(args.length-4 < 1){// Trop peu d'invitation / arguments
                afficherMessage({from: null, text: "Erreur : Il vous manque des arguments dans la commande, ou bien vous n'avez invité aucun joueur pour cette partie.<br>Utilisation : /svautour create [nbTours] [couleur] [pseudo...]", date: Date.now() });
                return;
            }
            else if(!colors.includes(choose_color)){// Couleur invalide
            afficherMessage({from: null, text: "Erreur : La couleur choisie n'est pas dans la liste des couleurs autorisées.<br>Couleurs possibles : rouge, vert, jaune, violet, bleu.", date: Date.now() });
            return;
            }
            sv_send_invite(args, nb_turns, choose_color);
        }
        else if(args[1] == "join"){
            if(args.length != 4){// nombre d'arguments invalide
                afficherMessage({from: null, text: "Erreur : Vous avez indiqué un nombre incorrect d'arguments pour cette commande.<br>Utilisation : /svautour join [id] [couleur]", date: Date.now() });
                return;
            }
            var id = parseInt(args[2]);
            if(!id && id != 0){// Id manquant
                afficherMessage({from: null, text: "Erreur : La commande est correcte, mais l'ID indiquée ne correspond à aucune partie en cours.", date: Date.now() });
                return;
            }
            else if(!colors.includes(args[3])){// Couleur invalide
                afficherMessage({from: null, text: "Erreur : La couleur choisie n'est pas dans la liste des couleurs autorisées.<br>Couleurs possibles : rouge, vert, jaune, violet, bleu.", date: Date.now() });
                return;
            }
            sock.emit("sv", {from : currentUser, id : id, color : args[3], option : 1});
        }
        else if(args[1] == "invite"){
            if(args.length != 4){// nombre d'arguments invalide
                afficherMessage({from: null, text: "Erreur : Vous avez indiqué un nombre incorrect d'arguments pour cette commande.<br>Utilisation : /svautour invite [id] [pseudo...]", date: Date.now() });
                return;
            }
            var id = parseInt(args[2]);
            if(!id && id != 0){// Id manquant
                afficherMessage({from: null, text: "Erreur : La commande est correcte, mais l'ID indiquée ne correspond à aucune partie en cours.", date: Date.now() });
                return;
            }
            sv_send_invite_v2(args, id);
        }
        else if(args[1] == "help"){
            afficherMessage({from: null, text: "Le jeu du Stupide Vautour : <br><br>But du jeu : Le but du jeu est d'être le joueur ayant le plus de points à la fin de la partie en prennant le plus de cartes positives pour vous et le moins de cartes négatives possible.<br><br>Quelles cartes? : Au début de chaque tour, la carte qui est mise en jeu (celle au millieu) est donnée à la personne qui remplit le mieux les conditions de victoire du tour.<br><br>Comment gagner la carte en jeu? : Tout dépends de la carte au milieu. Chaque joueur possède 15 cartes (numerotées de 1 à 15) qui sont défaussées quand jouées. A chaque début de tour, les joueurs regardent la carte du milieu et choisissent la carte qu'ils veulent mettre en jeu.<br><br>Conditions pour gagner la carte au centre : Si la carte du milieu a une valeur positive (carte souris), c'est le joueur ayant mis la carte qui la valeur la plus élevée qui l'emporte. Néanmoins, si la carte du milieu a une valeur négative (carte vautour), c'est le joueur ayant la carte avec la valeur la plus basse qui l'emporte.<br><br>Et en cas d'égalité ? : En cas d'égalité entre plusieurs joueurs, les cartes égales sont retirées du jeu, laissant le joueur ayant mis la carte éligible parmi celles qui restent prendre la carte au milieu.<br><br>Et en cas d'égalité parfaite ? : Si toutes les cartes des joueurs sont retirées, la carte au milieu reste au milieu, mais la carte suivante est quand même ajoutée au centre par dessus l'ancienne. Le prochain joueur qui gagne le round gagne toutes les cartes au centre. Les conditions de victoire du round sont décidées en fonction de la valeur de la carte au-dessus des autres cartes. Bien joué si vous arrivez dans cette situation par contre.<br><br>La fin de partie : Une fois toutes les cartes souris et vautour (celles du milieu) prises, chaque joueur fait la somme des valeurs de cartes gagnées, et c'est le joueur ayant le plus de points qui gagne. Après ça, la partie recommence s'il reste des manches à jouer. Dans le cas où toutes les manches ont été jouées, c'est le joueur ayant gagné le plus de manches qui est déclaré grand vainqueur de la session.<br><br>Conseils de startégie : Ne jouez pas tout de suite vos cartes les plus fortes! Gardez les pour les cartes de grande valeur. Faites néanmoins attention au autres joueurs qui peuvent avoir la même idée que vous! Ce serait balot que le joueur ayant mis 5 gagne car tout le monde a mis 14 non?", date: Date.now() });
        }
    }

    /**
     * Envoie les invitations aux personnes spécifiées dans la commande
     * 
     * @param {*} args      Les arguments de la commande
     * @param {*} nbturns   Le nombre de tours de la partie
     * @param {*} col       Les couleurs disponibles
     */
    function sv_send_invite(args, nbturns, col){
        var to = [];
        // On commence à 2 car args[0] = "/svautour" et args[1] = nb de parties
        for(var i = 4; i < args.length; i++){
            var curr = args[i];
            if (curr.startsWith("@")) {
                curr = curr.substring(1);
                if (curr == currentUser) {
                    afficherMessage({from: null, text: "Erreur : Il est impossible de jouer à Stupide Vautour avec soi-même. TROUVE DES AMIS !", date: Date.now() });
                    if(!document.getElementById("son_on").checked){
                        playText("C'est triste d'être seul", 0.8);
                    }
                    return;
                }
                else if(!users.includes(curr)){
                    afficherMessage({from: null, text: "Erreur : Il est interdit de défier un joueur qui n'existe pas...", date: Date.now() });
                    if(!document.getElementById("son_on").checked){
                        playText("T'es schizophrène?", 0.8);
                    }
                    return;
                }
                to.push(args[i].substr(1));
            }
            else{ // Le format n'est pas correct, un des pseudo ne commence pas par un @
                afficherMessage({from: null, text: "Erreur : Chaque pseudo doit commencer par un @. <br>Usage : /svautour create [nbTours] [pseudo...]", date: Date.now() });
                return;
            }
        }
        // création + invitations
        sock.emit("sv", {from : currentUser, invite : to, turns : nbturns, color : col, option : 0});
    }

    /**
     * Envoie les invitations aux personnes spécifiées dans la commande
     * 
     * @param {*} args      Les arguments de la commande
     * @param {int} game_id      l'id de la partie
     */
    function sv_send_invite_v2(args, game_id){ 
        var to = [];
        // On commence à 3 car args[0] = "/svautour", args[1] = "invite" et args[2] = id
        for(var i = 3; i < args.length; i++){
            var curr = args[i];
            if (curr.startsWith("@")) {
                curr = curr.substring(1);
                if (curr == currentUser) {
                    afficherMessage({from: null, text: "Erreur : Il est impossible de jouer à Stupide Vautour avec soi-même. TROUVE DES AMIS !", date: Date.now() });
                    if(!document.getElementById("son_on").checked){
                        playText("C'est triste d'être seul", 0.8);
                    }
                    return;
                }
                else if(!users.includes(curr)){
                    afficherMessage({from: null, text: "Erreur : Il est interdit de défier un joueur qui n'existe pas...", date: Date.now() });
                    if(!document.getElementById("son_on").checked){
                        playText("T'es schizophrène?", 0.8);
                    }
                    return;
                }
                to.push(args[i].substr(1));
            }
            else{ // Le format n'est pas correct, un des pseudo ne commence pas par un @
                afficherMessage({from: null, text: "Erreur : Chaque pseudo doit commencer par un @. <br>Usage : /svautour invite [pseudo...]", date: Date.now() });
                return;
            }
        }
        // création + invitations
        sock.emit("sv", {from : currentUser, invite : to, id : game_id, option : 5});
    }

    /**
     * Sert à ajouter le bouton de départ et d'invitation, ce qui met la commande directement dans le chat
     * 
     * @param {int} curr_id     L'id de la partie
     */
    function add_start_button(curr_id)
    {
        var btnStart = document.createElement("input");
        var btnInviter = document.createElement("input");
        btnStart.type = "button";
        btnInviter.type = "button";
        btnStart.value = "Start";
        btnInviter.value = "Invite";
        btnStart.id = curr_id + "start"
        btnStart.addEventListener('click', function() {
            sock.emit("sv", {id : curr_id, from : currentUser, option : 2});
        });
        btnInviter.addEventListener('click', function() {
            sv_invite(curr_id);
        });
        var p = document.createElement("p");
        p.classList.add("svautour");
        p.innerHTML = (new Date()).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }).substr(13, 8) + 
                        " - [Stupide Vautour] : Appuyez pour lancer la partie, mais attendez bien qu'au moins une personne ait rejoint la partie avant de la lancer. <br>Si vous avez oublié quelqu'un, appuyez sur le bouton \"Invite\".<br>L'id de votre partie est : " + curr_id +"<br>";     
        p.appendChild(btnStart);
        p.appendChild(btnInviter);
        document.querySelector("#content main").appendChild(p);
    }

    //Gestion des données envoyées par sockets
    sock.on("sv", function(data){
        switch(data.option){
            case 0 : // Reception d'une invitation
                //console.log(data.to);
                if(data.to.includes(currentUser)){
                    sv_get_invite(data.from, data.id);
                }
                break;
            case 1 : // réponse positive à une invitation
                games[data.id] = new sv_partie(data.id);
                var add_player = new player(data.colors[currentUser], currentUser, games[data.id].nextid, 0);
                //console.log(add_player);
                games[data.id].nextid++;
                games[data.id].players.push(add_player);
                init_all_players(data.id, data.scores, data.colors)
                show_game(data.colors[currentUser], data.id);
                if(data.init){
                    add_start_button(data.id);
                }
                break;
            case 2 : // réponse au jeu d'une carte
                if(data.agree){
                    var curr_card = games[data.id].cards[data.card-1];
                    document.getElementById(data.id + "plh").removeChild(curr_card);
                    const index = games[data.id].cards.indexOf(curr_card);
                    games[data.id].cards[index] = undefined;
                    //games[data.id].cards.splice(index, 1);
                    clearTimeout(games[data.id].play);
                    show_user_card(data.id);
                }
                else{
                    //games[data.id].cards[data.card].classList.remove("cartes");
                    document.getElementById(data.id + "plh").classList.add("buzz");
                    setTimeout(function() {
                        document.getElementById(data.id + "plh").classList.remove("buzz");
                        //games[data.id].cards[data.card].classList.add("cartes");
                    }, 500);
                }
                break;
            case 3 : // Un joueur rejoint la partie
                if(!games[data.id] || data.name == currentUser){ // Si nous ne sommes pas dans la partie ou si il s'agit de nous 
                    break;
                }
                else{   
                    //console.log(games);
                    var add_player = new player(data.color, data.name, games[data.id].players.length, 0);
                    games[data.id].players.push(add_player);
                    update_players(data.id);
                }
                break;
            case 4 : // La partie commence
                games[data.id].current_mid = data.mid;
                playText("Et c'est parti, après 10 millénaires d'attente...", 1);
                show_mid(data.id);
                break;
            case 5 : // Un nouveau tour
                games[data.id].current_mid = data.mid;
                show_mid(data.id);
                var before = get_player_score(data.id);
                update_scores(data.id, data.scores);
                var after = get_player_score(data.id);
                if(after < before){
                    playText("C'est dingue de puer la mort à ce point", 1);
                }
                update_players(data.id);
                games[data.id].play = setTimeout(function(){ playText("Allez, joue plus vite, on a pas que ça à faire", 1); }, 10000);
                break;
            case 6 : // Un joueur joue une carte
                player_play(data.pseudo, data.id);
                break;
            case 7 : // nouvelle manche
                games[data.id].current_mid = data.mid;
                show_mid(data.id);
                update_scores(data.id, data.scores);
                update_players(data.id);
                init_hand(get_player_color(data.id), data.id);
                show_user_card(data.id);
                break;
            case 8 : // fin de la partie
                if(data.winner.includes(currentUser)){
                    playText("Bien joué beau gosse! Comme quoi t'es pas si nul que ça quand t'as de la chance!", 1);
                }
                else{
                    playText("Bon t'es nul t'as perdu. Mais bon tu feras peut-être mieux la prochaine fois. j'y crois pas mais on verra bien", 1.3);
                }
                close_game(false);
                break;
            case 9 : // Un joueur se déconnecte
                if(games[data.id]){
                    playText("Ah, il semblerait qu'un rageux ait quitté la partie.", 1);
                    for(var i = 0; i < games[data.id].players.length; i++){
                        if(games[data.id].players[i].name == data.from){
                            games[data.id].players[i].name = data.new;
                        }
                    }
                }
                break;
        }
    });

    /**
     * Permet d'afficher la carte choisie par un joueur
     * 
     * @param {string} pseudo    Le pseudonyme du joueur
     * @param {int} id           L'id de la partie
     */
    function player_play(pseudo, id){
        var id_player = -1;
        for(var i = 0; i < games[id].players.length; i++){
            if(games[id].players[i].name == pseudo){
                id_player = i;
                break;
            }
        }
        if(id_player != -1){
            var joueur = document.getElementById(id + "-j" + games[id].players[id_player].id);
            var img = document.createElement("img");
            img.src = "./img/" + games[id].players[id_player].color + "/retourne.png";
            img.title = "a joué";
            joueur.appendChild(img);
            // Exemple : <img src="./img/violet/retourne.png" title="a joué">
        }
    }

    /**
     * Mets à jour les scores des joueurs de la partie indiquée
     * 
     * @param {int} id          L'id de la partie
     * @param {int[]} scores    Les scores des joueurs
     */
    function update_scores(id, scores){
        for(var i = 0; i < games[id].players.length; i++){
            //console.log(games[id].players[i].name);
            games[id].players[i].score = scores[games[id].players[i].name];
        }
    }

    /**
     * Permet de mettre tout les joueurs à 0
     * 
     * @param {int} id              L'id de la partie
     * @param {int[]} scores        Les scores des joueurs
     * @param {string[]} colors     Les couleurs des joueurs
     */
    function init_all_players(id, scores, colors){
        for(var key in scores){
            if(key != currentUser){
                var add_player = new player(colors[key], key, games[id].nextid, scores[key]);
                new player()
                games[id].players.push(add_player);
                games[id].nextid++;
            }
        }
    }

    /**
     * Permet de créer le message de reception d'une invitation
     * 
     * @param {string} owner Propriétaire de la partie
     * @param {Int} id Id de la partie utile pour le coté serveur
     */
    function sv_get_invite(owner, id){
        var btnRepondre = document.createElement("input");
        btnRepondre.type = "button";
        btnRepondre.value = "Rejoindre";
        btnRepondre.id = id + "btnRepondre";
        btnRepondre.addEventListener("click", function() { sv_join(id); });
        var p = document.createElement("p");
        p.classList.add("svautour");
        p.innerHTML = (new Date()).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }).substr(13, 8) + 
                        " - [Stupide Vautour] : " + owner + " t'invite à une partie (id : " + id + ") de Stupide Vautour ";     
        p.appendChild(btnRepondre);
        document.querySelector("#content main").appendChild(p);
    }

    /**
     * Permet d'avoir la commande pour rejoindre une partie
     * 
     * @param {int} id  L'id de la partie
     */
    function sv_join(id){
        document.getElementById("monMessage").value = "/svautour join " + id + " [Couleur]";
    }

    /**
     * Permet d'avoir la commande pour inviter des gens
     * 
     * @param {int} id  L'id de la partie
     */
    function sv_invite(id){
        document.getElementById("monMessage").value = "/svautour invite " + id + " @";
    }


    /**
     * Permet de mettre le background en mode light par défaut
     */
    function set_background(){
        if(sessionStorage.getItem("Background") == "White"){
            document.body.classList.remove("dark");
            document.getElementById("content").classList.remove("dark");
            document.getElementById("logScreen").classList.remove("dark");
            document.getElementById("son").src = "img/son_clair.png";
            for(var key in games){
                document.getElementById(key).classList.remove("dark");
            }
        }
        else{
            document.body.classList.add("dark");
            document.getElementById("content").classList.add("dark");
            document.getElementById("logScreen").classList.add("dark");
            document.getElementById("son").src = "img/son_fonce.png";
            for(var key in games){
                document.getElementById(key).classList.add("dark");
            }
        }
    }

    var keysPressed = {}

    //Quand la combinaison de touche d+a+r+k est pressée, passe en mode sombre si le thème actuel est light, et vice-versa
    document.addEventListener('keydown', (event) => {
        keysPressed[event.key] = true;
        // Lorsque l'utilisateur press les touches 'd' 'a' 'r' 'k' en même temps le thème arrive
        if (keysPressed['d'] && keysPressed['a'] && keysPressed['r'] && event.key == 'k') {
            alert("DARK MODE IS COMING");
            if(sessionStorage.getItem("Background") == "White"){
                sessionStorage.setItem("Background","Black");
            }
            else{
                sessionStorage.setItem("Background","White");
            }
            set_background();
        }
     });
     
     document.addEventListener('keyup', (event) => {
        delete keysPressed[event.key];
     });

});
    