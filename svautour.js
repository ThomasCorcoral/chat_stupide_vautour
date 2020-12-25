/********************************************************************
 *   Module implémentant un jeu de Stupide Vautour
 ********************************************************************/

var games = new Array;

class player {   // Classe définissant un joueur
    constructor (color) {
        this.color = color;
        this.score = 0;
        this.play = -1;
        this.hand = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
        this.ia = false;
    }
}

class game {    // Classe définissant une partie
    constructor(nb_turns, owner) {
        this.players = {};
        this.number_turns = nb_turns-1; // -1 on compte le premier tour
        this.available_colors = ["rouge", "violet", "vert", "bleu", "jaune"];
        this.mid = [-5,-4,-3,-2,-1,1,2,3,4,5,6,7,8,9,10];
        this.current_mid = new Array;
        this.start = false;
        this.admin = owner;
        this.curr_ia = 0;
    }
}

/**
 * Attribue un id et un admin à une nouvelle partie durant nb_turns tours
 * 
 * @param {int} nb_turns    Le nombre de tours de la partie
 * @param {string} owner         L'admin de la partie
 */
function init(nb_turns, owner){
    var id = games.length;
    var new_game = new game(nb_turns, owner);
    games.push(new_game);
    return id;
}

/**
 * Permet d'indiquer si la partie indiquée existe ou non
 * 
 * @param {int} id    L'id de la partie
 */
function exist(id){
    if(games[id]){
        return true;
    }
    return false;
}

/**
 * Sert à réinitialiser les cartes du milieu
 * 
 * @param {int} id    L'id de la partie
 */
function reset_mid_hands(id){
    games[id].mid = [-5,-4,-3,-2,-1,1,2,3,4,5,6,7,8,9,10];
    for (var key in games[id].players) {
        games[id].players[key].hand = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    }
}

/**
 * permet d'obtenir les scores des joueurs présent dans une partie
 * 
 * @param {int} id    L'id de la partie
 */
function get_scores(id){
    /*console.log(id);
    //console.log(games[id]);*/
    var res = {};
    for (var key in games[id].players) {
        res[key] = games[id].players[key].score;
    }
    return res;
}

/**
 * Permet d'obtenir les couleurs des joueurs dans la partie
 * 
 * @param {int} id    L'id de la partie
 */
function get_colors(id){
    var res = {};
    for (var key in games[id].players) {
        res[key] = games[id].players[key].color;
    }
    return res;
}

/**
 * Permet de savoir si la couleur indiquée est acceptable ou non (pas prise)
 * 
 * @param {int} id    L'id de la partie
 * @param {string} color    la couleur souhaitée
 */
function not_conform_color(id, color){
    return !games[id].available_colors.includes(color);
}

/*
function col(id){
    return games[id].available_colors;
}*/

/**
 * Permet d'ajouter un joueur à la partie id, avec le pseudo pseudo et la couleur color
 * 
 * @param {int} id      L'id de la partie
 * @param {string} pseudo    Le pseudonyme du joueur
 * @param {string} color     La couleur du joueur
 */
function ajouter(id, pseudo, color) {
    //console.log("The owner is : " + games[id].admin);
    if(games[id].start){ // Si la partie a déjà commencé alors on refuse le joueur
        //console.log("Erreur : La partie a déjà commencée.");
        return false;
    }
    const regex = RegExp('^IA[0-4]$');
    if(regex.test(games[id].admin)){
        //console.log("Erreur : Le créateur de la partie a quitté et n'a pas lancé la partie.");
        return false;
    }
    // Vérification des paramètres
    if(not_conform_color(id, color)){
        //console.log("Erreur : La couleur est déjà prise " + pseudo + ". Il reste : " + games[id].available_colors);
        return false;
    }
    if(games[id].players[pseudo]){
        //console.log("Erreur : Le joueur " + pseudo + " est déjà dans la partie");
        return false;
    }
    games[id].players[pseudo] = new player(color);
    const index = games[id].available_colors.indexOf(color);
    if (index > -1) {
        games[id].available_colors.splice(index, 1);
    }
    return true;
}

/**
 * Permet de valider (ou non) la carte choisie par le joueur
 * 
 * @param {int} id              L'id de la partie
 * @param {string} pseudo       Le pseudonyme du joueur
 * @param {int} card            La carte indiquée
 */
function player_choice(id, pseudo, card){
    // Si la carte n'est pas disponible dans sa main alors on refuse son choix
    if(games[id].players[pseudo].hand.indexOf(card) < 0){
        return false;
    }
    // Si il a déjà choisi sa carte on ne peut pas la changer 
    if(games[id].players[pseudo].play != -1){
        return false;
    }
    games[id].players[pseudo].play = card;
    const index = games[id].players[pseudo].hand.indexOf(card);
    if (index > -1) {
        games[id].players[pseudo].hand.splice(index, 1);
    }
    return true;
}

/**
 * Retourne un chiffre entre 0 (inclu) et max (exclu)
 * 0 >= res > max
 * 
 * @param {int} max     Nombre maximum (exclu) que la valeur peut prendre 
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

/**
 * Permet de choisir la carte qu'il faudra gagner aléatoirement 
 * en fonction de ce qu'il reste dans la pioche du milieu
 * 
 * @param {int} id    L'id de la partie
 */
function choose_mid(id){
    var to_add = games[id].mid[getRandomInt(games[id].mid.length)]
    games[id].current_mid.push(to_add);
    const index = games[id].mid.indexOf(to_add);
    if (index > -1) {
        games[id].mid.splice(index, 1);
    }
    return games[id].current_mid;
}

/**
 * Permet de remplacer un joueur ayant quitté pour le reste de la partie
 * 
 * @param {int} id    L'id de la partie
 * @param {int} key   Le joueur ayant quitté
 */
function ia_play(id, key){
    if(games[id].players[key].play != -1){
        return false;
    }
    var to_win = calcul_mid_score(games[id].current_mid);
    var big_val = getRandomInt(5) + 5
    var id_card = 0;
    if(to_win > big_val){ // grosse valeur
        if(games[id].players[key].hand.length < 3){
            id_card = games[id].players[key].hand.length-1;
        }else{
            id_card = games[id].players[key].hand.length-1-getRandomInt(3);
        }
    }else if(to_win < -2){ // gros malus
        if(games[id].players[key].hand.length < 3){
            id_card = games[id].players[key].hand.length-1;
        }else{
            id_card = games[id].players[key].hand.length-1-getRandomInt(3);
        }
    }else{
        id_card = getRandomInt(games[id].players[key].hand.length-1);
    }
    games[id].players[key].play = games[id].players[key].hand[id_card];
    games[id].players[key].hand.splice(id_card, 1);
    return true;
}

/**
 * Vérifie que tout le monde a bien joué 
 * true : tout le monde a joué
 * false : il manque un ou des joueurs
 * 
 * @param {int} id  L'id de la partie 
 */
function everyone_play(id){
    for (var key in games[id].players) {
        if(games[id].players[key].play == -1){
            if(games[id].players[key].ia){
                ia_play(id, key);
            }else{
                return false;
            }
        }
    }
    return true;
}

/**
 * Dans le cas ou il y aurait plusieurs cartes en jeu au milieu, sert à calculer le score total en jeu
 * 
 * @param {int[]} cur_mid  Les cartes actuellement au milieu
 */
function calcul_mid_score(cur_mid){
    var res = 0;
    for(var i = 0; i < cur_mid.length; i++){
        res += cur_mid[i];
    }
    return res;
}

/**
 * Algorithme qui permet de déterminer le gagnant des points
 * en fonction de la valeur de la carte en jeu
 * 
 * @param {int} id      L'id de la partie
 * @param {int} limit   Permet de gérer les cas d'égalité
 */
function get_winner(id, limit){
    var sum_mid = calcul_mid_score(games[id].current_mid); 
    if(limit == 16 && sum_mid < 0){
        limit = 0; // Si l'on joue pour un score négatif il faut chercher la plus petite carte donc on change la limite
    }
    var res = new Array;
    var max = 0;
    var min = 16;
    for (var key in games[id].players) {
        if(sum_mid > 0){ // Si on joue pour un score positif
            if(games[id].players[key].play > max && games[id].players[key].play < limit){
                max = games[id].players[key].play;
                res = [];
                res.push(key); 
            }
            else if(games[id].players[key].play == max){
                res.push(key);
            }
        }
        else{ // Si on joue pour une carte négative alors le plus faible "gagne"
            if(games[id].players[key].play < min && games[id].players[key].play > limit){
                min = games[id].players[key].play;
                res = [];
                res.push(key); 
            }
            else if(games[id].players[key].play == min){
                res.push(key);
            }
        }
    }
    if(res.length > 1){ // Si il y a une égalité ou va chercher la seconde plus grande carte
        if(sum_mid < 0){
            return get_winner(id, min);
        }
        return get_winner(id, max);
    }
    return res;
}

/**
 * Retourne le tableau des vainqueurs de la partie
 * 
 * @param {int} id  l'id de la partie 
 */
function get_final_winner(id){
    var max_scr = -1;
    var res = [];
    for(key in games[id].players){
        if(games[id].players[key].score > max_scr){
            res = [];
            res.push(key);
            max_scr = games[id].players[key].score;
        }
        else if(games[id].players[key].score == max_scr){
            res.push(key);
        }
    }
    return res;
}

/**
 * Réinitialise la main de tous les joueurs dans la parie indiquée
 * 
 * @param {int} id    L'id de la partie
 */
function reset_player_play(id){
    for (var key in games[id].players) {
        games[id].players[key].play = -1;
    }
}

/**
 * Permet de terminer un tour en déterminant le gagnant et modifiant le score
 * 
 * @param {int} id    L'id de la partie
 */
function score_comput(id){
    var win = get_winner(id, 16); // On initialise la limite à 16 car les cartes s'arrêtent à 15
    if(win.length == 1){ // Si il y a un gagnant alors il récupère le score
        games[id].players[win[0]].score += calcul_mid_score(games[id].current_mid);
        games[id].current_mid = [];
    }
}

/**
 * Permet d'indiquer la fin d'un tour par le fait qu'il n'y ait plus de cartes disponibles au centre
 * 
 * @param {int} id    L'id de la partie
 */
function is_turn_finish(id){
    if(games[id].mid.length == 0){
        return true;
    }
    return false;
}

/**
 * Permet d'indiquer qu'une partie est finie car le nombre restant de tour est nul
 * 
 * @param {int} id    L'id de la partie
 */
function is_game_finish(id){
    return games[id].number_turns == 0;
}

/**
 * Permet de finir un tour en modifiant les scores et en réinitialisant le
 * choix des joueurs
 * 
 * @param {int} id    L'id de la partie
 * 
 * @return -1 si tout le monde n'a pas joué
 * @return 0 si l'on passe à un nouveau tour
 * @return 1 si l'on change de manche
 * @return 2 si la partie est finie
 */
function finish_turn(id){
    if(!everyone_play(id)){
        return -1;
    }
    score_comput(id);
    reset_player_play(id);
    if(is_turn_finish(id)){
        reset_mid_hands(id);
        if(is_game_finish(id)){
            return 2;
        }
        games[id].number_turns--;
        return 1;
    }
    return 0
}

/**
 * fait en sorte qu'un joueur quitte la partie et le remplace par une IA
 * 
 * @param {int} id      L'id de la partie
 * @param {string} pseudo    Le pseudonyme du joueur
 */
function leave(id, pseudo){
    games[id].players[pseudo].ia = true;
    games[id].players["IA" + games[id].curr_ia] = games[id].players[pseudo];
    if(pseudo == games[id].admin){
        games[id].admin = "IA" + games[id].curr_ia;
    }
    //console.log("pseudo : " + pseudo + " / Owner : " + games[id].admin);
    delete(games[id].players[pseudo]);
    games[id].curr_ia++;
    return "IA" + (games[id].curr_ia-1);
}

/**
 * Permet de récupérer la main d'un joueur
 * 
 * @param {string} pseudo Pseudo du joueur
 */
function get_hand(id, pseudo){
    return games[id].players[pseudo].hand;
}

/**
 * Permet à l'admin (créateur) d'une partie de la lancer
 * 
 * @param {int} id      L'id de la partie
 * @param {String} pseudo    le pseudonyme du joueur
 */
function start_game(id, pseudo){
    if(games[id]){
        if(games[id].start){
            return false;
        }
        else if(games[id].admin == pseudo && Object.keys(games[id].players).length > 1){
            games[id].start = true;
            return true;
        }
    }
    return false;
}


/**
 * Permet d'indiquer si oui ou non la partie à déjà commencée
 * 
 * @param {int} id      L'id de la partie
 */
function has_start(id){
    return games[id].start;
}

/**
 * Si un joueur se déconnecte, le fait quitter toutes ses parties
 * 
 * @param {String} player   Le pseudonyme du joueur
 */
function disconnect(player){
    var res = {};
    for(var key in games){
        if(player in games[key].players){
            var new_pseudo = leave(key, player);
            res[key] = new_pseudo;
        }
    }
    return res;
}

//Refaire fonction de reception de l'invit' quand l'user est pas en partie

// Définition des fonctions exportées
module.exports = { ajouter, get_scores, get_colors/*, col*/, player_choice, exist,
    choose_mid, everyone_play, get_winner, finish_turn, get_hand, start_game, has_start,
    init, get_final_winner, leave, disconnect};