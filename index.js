// Chargement des modules 
var express = require('express');
var app = express();
var server = app.listen(8080, function() {
    console.log("C'est parti ! En attente de connexion sur le port 8080...");
});

// Ecoute sur les websockets
var io = require('socket.io').listen(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to 
app.get('/', function(req, res) {  
    res.sendFile(__dirname + '/public/chat.html');
});

// déblocage requetes cross-origin
io.set('origins', '*:*');

/***************************************************************
 *           Gestion des clients et des connexions
 ***************************************************************/

var clients = {};       // { id -> socket, ... }


/***************************************************************
 *              Gestion des défis Chi-Fou-Mi 
 ***************************************************************/

var chifoumi = require("./rpsls");
var sv = require("./svautour");


/**
 *  Supprime les infos associées à l'utilisateur passé en paramètre.
 *  @param  string  id  l'identifiant de l'utilisateur à effacer
 */
function supprimer(id) {
    delete clients[id];
    chifoumi.supprimer(id);
}


// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {
    
    // message de debug
    console.log("Un client s'est connecté");
    var currentID = null;
    
    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function(id) {
        const regex = RegExp('^IA[0-4]$');
        // si le pseudo est déjà utilisé, on lui envoie l'erreur
        if (clients[id] || regex.test(id)) {
            socket.emit("erreur-connexion", "Erreur : Le pseudo est déjà pris par un autre joueur.");
            return;
        }
        // sinon on récupère son ID
        currentID = id;
        // initialisation
        clients[currentID] = socket;
        chifoumi.ajouter(currentID);
        // log
        console.log("Nouvel utilisateur : " + currentID);
        // scores 
        var scores = JSON.parse(chifoumi.scoresJSON());
        // envoi d'un message de bienvenue à ce client
        socket.emit("bienvenue", scores);
        // envoi aux autres clients 
        socket.broadcast.emit("message", { from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() });
        // envoi de la nouvelle liste à tous les clients connectés 
        socket.broadcast.emit("liste", scores);
    });
    
    
    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg      le message à transférer à tous  
     */
    socket.on("message", function(msg) {
        console.log("Reçu message");   
        // si message privé, envoi seulement au destinataire
        if (msg.to != null) {
            if (clients[msg.to] !== undefined) {
                console.log(" --> message privé");
                clients[msg.to].emit("message", { from: currentID, to: msg.to, text: msg.text, date: Date.now() });
                if (currentID != msg.to) {
                    socket.emit("message", { from: currentID, to: msg.to, text: msg.text, date: Date.now() });
                }
            }
            else {
                socket.emit("message", { from: null, to: currentID, text: "Erreur : L'Utilisateur " + msg.to + " est inconnu.", date: Date.now() });
            }
        }
        // sinon, envoi à tous les gens connectés
        else {
            console.log(" --> broadcast");
            io.sockets.emit("message", { from: currentID, to: null, text: msg.text, date: Date.now() });
        }
    });
    
    
    /**
     *  Réception d'une demande de défi
     */
    socket.on("chifoumi", function(data) {
        data.choice = data.choice.substring(1, data.choice.length - 1);
        var res = chifoumi.defier(currentID, data.to, data.choice);
        switch (res.status) {
            case 1: 
                clients[data.to].emit("chifoumi", currentID );
            case -1: 
            case -2: 
                socket.emit("message", { from: 0, to: currentID, text: res.message, date: Date.now() });
                break;
            case 0:
                if (res.resultat.vainqueur == null) {
                    socket.emit("message", { from: 0, to: currentID, text: res.resultat.message, date: Date.now() });
                    clients[data.to].emit("message", { from: 0, to: data.to, text: res.resultat.message, date: Date.now() });
                }
                else {
                    clients[res.resultat.vainqueur].emit("message", { from: 0, to: res.resultat.vainqueur, text: res.resultat.message + " - C'est gagné!", date: Date.now() });
                    clients[res.resultat.perdant].emit("message", { from: 0, to: res.resultat.perdant, text: res.resultat.message + " - C'est perdu...", date: Date.now() });
                    io.sockets.emit("liste", JSON.parse(chifoumi.scoresJSON()));
                }
                break;
        }
    });

    /**
     *  Réception d'une création de Stupide Vautour
     */
    socket.on("sv", function(data){
        switch(data.option){
            case 0 : // Invitations + création
                var new_id = sv.init(data.turns, data.from);
                sv.ajouter(new_id, data.from, data.color);
                socket.emit("sv", {id : new_id, colors : sv.get_colors(new_id), scores : sv.get_scores(new_id), option : 1, init : true}); // Donne l'id de la partie au joueur 
                invite_svautour(data.invite, data.from, new_id);
                break;
            case 1 : // Un utilisateur se connecte à la partie
                if(!sv.exist(data.id)){
                    socket.emit("message", {from : null, to : data.from, text :  "Erreur : L'ID indiqué ne correspond à aucune partie en cours.", date: Date.now()});
                }
                else if(!sv.has_start(data.id)){ // Le joueur peut rejoindre la partie
                    //console.log("Le joueur " + data.from + " rejoint la partie " + data.id + " avec la couleur " + data.color);
                    if(sv.ajouter(data.id, data.from, data.color)){
                        socket.emit("sv", {id : data.id, colors : sv.get_colors(data.id), scores : sv.get_scores(data.id), option : 1, init : false}); // add player list
                        socket.broadcast.emit("sv", {id : data.id, name : data.from, color:data.color, option : 3});
                    }
                    else{
                        socket.emit("message", {from : null, to : data.from, text : "Erreur : Vous ne pouvez pas rejoindre cette partie car vous l'avez déjà rejoint ou bien la couleur choisie est déjà prise par un autre utilisateur.", date: Date.now()});
                    }
                }
                else{
                    socket.emit("message", {from : null, to : data.from, text : "Erreur : La partie est déjà commencée, impossible de la rejoindre en cours de route.", date: Date.now()});
                }
                break;
            case 2 : // Début d'une partie (/svautour start)
                if(sv.start_game(data.id, data.from)){
                    var new_mid = sv.choose_mid(data.id);
                    socket.emit("sv", { id : data.id, mid : new_mid, option : 4 });
                    socket.broadcast.emit("sv", { id : data.id, mid : new_mid, option : 4 });
                }
                else{
                    socket.emit("message", {from : null, to : data.from, text : "Erreur : Vous ne pouvez pas faire cette commande (Soit la partie n'existe pas, soit elle a déjà commencée).", date: Date.now()});
                }
                break;
            case 3 : // Un joueur choisit une carte
                if(!sv.has_start(data.id)){
                    socket.emit("message", {from : null, to : data.from, text : "Erreur : Vous ne pouvez pas choisir de carte tant que la partie n'a pas commencée.", date: Date.now()});
                    socket.emit("sv", {id : data.id, card : data.card, option : 2, agree : false});
                }
                else if(sv.player_choice(data.id, data.from, data.card)){
                    socket.emit("sv", {id : data.id, card : data.card, option : 2, agree : true});
                    if(sv.everyone_play(data.id)){ // On vérifie que le tour n'est terminé
                        // Si tout le monde à joué on détermine le vaiqueur et on passe au tour suivant
                        var win = sv.get_winner(data.id, 16);
                        var check = sv.finish_turn(data.id);
                        switch(check){
                            case -1: // erreur tout le monde n'a pas joué
                                break;
                            case 0: // tour suivant
                                var new_mid = sv.choose_mid(data.id);
                                socket.emit("sv", { id : data.id, scores : sv.get_scores(data.id), mid : new_mid, option : 5 });
                                socket.broadcast.emit("sv", { id : data.id, scores : sv.get_scores(data.id), mid : new_mid, option : 5 });
                                break;
                            case 1: // Nouvelle manche
                                var new_mid = sv.choose_mid(data.id);
                                socket.emit("sv", { id : data.id, scores : sv.get_scores(data.id), mid : new_mid, option : 7 });
                                socket.broadcast.emit("sv", { id : data.id, scores : sv.get_scores(data.id), mid : new_mid, option : 7 });
                                break;
                            case 2: // fin de la partie
                                var winners = sv.get_final_winner(data.id);
                                socket.emit("sv", { id : data.id, winner : winners, option : 8 });
                                socket.broadcast.emit("sv", { id : data.id, winner : winners, option : 8 });
                                break;
                        }
                    }
                    else{
                        socket.broadcast.emit("sv", {id : data.id, pseudo : data.from, card : data.card, option : 6});
                    }
                }
                else{
                    socket.emit("message", {from : null, to : data.from, text : "Erreur : Il est impossible de jouer cette carte (Soit vous ne l'avez plus, soit vous avez déjà joué ce tour ci).", date: Date.now()});
                    socket.emit("sv", {id : data.id, card : data.card, option : 2, agree : false});
                }
                break;
            case 4 : // Un joueur quitte une partie
                var new_pseudo = sv.leave(data.id, data.pseudo);
                socket.broadcast.emit("sv", {id:data.id, from : currentID, new : new_pseudo , option:9})
                break;
            case 5 : //Invitation simple
                invite_svautour(data.invite, data.from, data.id);
                break;
        }
    });

    /**
     * Permet de créer une partie et d'inviter les joueurs players à la partie de owner qui a l'id game_id
     * 
     * @param {string[]} players 
     * @param {string} owner 
     * @param {int} game_id 
     */
    function invite_svautour(players, owner, game_id){
        socket.broadcast.emit("sv", {from : owner, to : players, option : 0, id : game_id});
    }

    /**
     * Permet d'inviter les joueurs players à la partie déjà existante de owner qui a l'id game_id
     * 
     * @param {string[]} players 
     * @param {string} owner 
     * @param {int} game_id 
     */
    function invite_svautour_v2(players, owner, game_id){
        socket.emit("sv", {from : owner, to : players, option : 0, id : game_id});
    }

    /** 
     *  Gestion des déconnexions
     */
    
    // fermeture
    socket.on("logout", function() { 
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            console.log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message", 
                { from: null, to: null, text: currentID + " a quitté la discussion", date: Date.now() } );
            var ids = sv.disconnect(currentID);
            for(key in ids){
                socket.broadcast.emit("sv", {id:key, from:key, new:ids[key], option:9})
            }
            // suppression de l'entrée
            supprimer(currentID);
            // désinscription du client
            currentID = null;
             // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", JSON.parse(chifoumi.scoresJSON()));
        }
    });
    
    // déconnexion de la socket
    socket.on("disconnect", function(reason) { 
        // si client était identifié
        if (currentID) {
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message", 
                { from: null, to: null, text: currentID + " vient de se déconnecter de l'application", date: Date.now() } );

            var ids = sv.disconnect(currentID);
            for(key in ids){
                socket.broadcast.emit("sv", {id:key, from:currentID, new:ids[key], option:9})
            }

            // suppression de l'entrée
            supprimer(currentID);
            // désinscription du client
            currentID = null;
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", JSON.parse(chifoumi.scoresJSON()));
        }
        console.log("Client déconnecté");
    });
        
});