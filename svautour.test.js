// Assertions
const assert = require('assert').strict;

const { get_hand } = require('./svautour.js');
const sv = require('./svautour.js');

describe("Gestion des parties", function() {

    //Verifie si la création d'une partie simple est possible
    it("Créer une partie", function() {
        var id = sv.init(3);    // id = 0
        assert.strictEqual(id == 0, true);
        assert.strictEqual(sv.exist(id), true);
        assert.strictEqual(sv.exist(id+1), false);
    });

    //Verifie si la création de plusieurs partie en même temps est possible
    it("Créer plusieurs parties", function() {
        var id2 = sv.init(3);  // id2 = 1
        var id3 = sv.init(2);  // id3 = 2
        assert.strictEqual(id2 != id3, true);
    });
});

describe("Gestion des utilisateurs", function() {

    //Test de l'ajout d'un joueur
    it("Ajouter un nouveau joueur", function() {
        var id = 0; // On reprend la première partie créée 
        assert.strictEqual(sv.ajouter(id,"Thomas", "rouge"), true); 
        var score = sv.get_scores(id);
        assert.strictEqual(score["Thomas"], 0);
    });
    
    //Test du refus d'un joueur déjà dans la partie
    it("Refuser un joueur existant", function() {
        var id = 0;
        assert.strictEqual(sv.ajouter(id, "Thomas", "rouge"), false); 
        var score = sv.get_scores(id);
        assert.strictEqual(score["Thomas"], 0);
    });

    //Test du refus d'un joueur ayant choisi une couleur non acceptée
    it("Refuser une mauvaise couleur", function() {
        var id = 0;
        assert.strictEqual(sv.ajouter(id, "Maximilien", "kaki"), false);  
    });

    //Test du refus d'un joueur si la couleur choisie est déjà prise
    it("Refuser une couleur déjà prise", function() {
        var id = 0;
        assert.strictEqual(sv.ajouter(id, "Maximilien", "rouge"), false);  
    });

    //Test du refus d'un joueur si la partie est pleine
    it("Refuser un sixième joueur", function() {
        var id = 0;
        assert.strictEqual(sv.ajouter(id, "Maximilien", "bleu"), true);
        assert.strictEqual(sv.ajouter(id, "Hannah", "vert"), true);
        assert.strictEqual(sv.ajouter(id, "Marion", "violet"), true);
        assert.strictEqual(sv.ajouter(id, "Maxime", "jaune"), true);
        assert.strictEqual(sv.ajouter(id, "Cristelle", "rouge"), false);   
    });

    //Test d'ajout de joueurs dans une partie en paralèlle
    it("Remplir une autre partie", function() {
        var id = 1;
        assert.strictEqual(sv.ajouter(id, "Maximilien", "bleu"), true);
        assert.strictEqual(sv.ajouter(id, "Cristelle", "rouge"), true);   
    });

});

describe("Preparation au tour du joueur", function() {

    //Test du refus d'une carte que le joueur n'a pas
    it("Refuser de jouer une carte que le joueur n'a pas", function() {
        var id = 0;
        assert.strictEqual(sv.player_choice(id, "Thomas", 16), false); 
    });

    //Test de choix d'une carte que le joueur possède
    it("Joue une carte classique", function() {
        var id = 0;
        assert.strictEqual(sv.player_choice(id, "Thomas", 12), true); 
    });

    //Test du refus d'une carte car le joueur a déjà joué
    it("Refuser de changer son choix", function() {
        var id = 0;
        assert.strictEqual(sv.player_choice(id, "Thomas", 11), false); 
    });

    //Test du refus d'une carte que le joueur n'a pas joué
    it("Tout le monde n'a pas joué", function() {
        var id = 0;
        assert.strictEqual(sv.everyone_play(id), false); 
    });

    //Test de vérification de la fin du tour de tout les joueurs
    it("Tout le monde a joué", function() {
        var id = 0;
        assert.strictEqual(sv.player_choice(id, "Maximilien", 10), true);
        assert.strictEqual(sv.player_choice(id, "Hannah", 8), true);
        assert.strictEqual(sv.player_choice(id, "Marion", 9), true);
        assert.strictEqual(sv.player_choice(id, "Maxime", 7), true);
        assert.strictEqual(sv.everyone_play(id), true); 
    });

});

describe("Deroulement du tour et score", function() {

    //Test de vérification du vainqueur en cas de cartes sans amiguïté
    it("Determination simple d'un vainqueur", function() {
        var id = 0;
        var mid = sv.choose_mid(id);
        var win = sv.get_winner(id, 16);
        var comput_mid = 0;
        for(var i = 0; i < mid.length; i++){
            comput_mid += mid[i];
        }
        assert.strictEqual(win.length, 1); // Un seul gagnant car pas d'égalité
        if(comput_mid < 0){
            assert.strictEqual(win[0], "Maxime"); // Maxime perdant car 7 < 8 ...
        }
        else{
            assert.strictEqual(win[0], "Thomas"); // Thomas vainqueur car 12 > 10 ...
        }
    });

    //Test de vérification que les cartes au milieu s'ajoutent bien au score
    it("Score bien incrémenté", function() {
        var id = 0;
        var mid = sv.choose_mid(id);
        sv.finish_turn(id);
        var score = sv.get_scores(id);
        var comput_mid = 0;
        for(var i = 0; i < mid.length; i++){
            comput_mid += mid[i];
        }
        if(comput_mid < 0){
            assert.strictEqual(score["Maxime"], comput_mid);
            assert.strictEqual(score["Maxime"] < 0, true);
        }
        else{
            assert.strictEqual(score["Thomas"], comput_mid);
        }
    });

    //Test de vérification du vainqueur en cas de cartes avec égalité
    it("Gestion du score cas d'égalité", function() {
        var id = 0;
        assert.strictEqual(sv.player_choice(id, "Thomas", 14), true);
        assert.strictEqual(sv.player_choice(id, "Maximilien", 14), true);
        assert.strictEqual(sv.player_choice(id, "Hannah", 12), true);
        assert.strictEqual(sv.player_choice(id, "Marion", 5), true);
        assert.strictEqual(sv.player_choice(id, "Maxime", 5), true);
        assert.strictEqual(sv.everyone_play(id), true); 
        var mid = sv.choose_mid(id);
        var win = sv.get_winner(id, 16);
        sv.finish_turn(id);
        assert.strictEqual(win.length, 1); // Un seul gagnant car pas d'égalité
        assert.strictEqual(win[0], "Hannah");
    });

    //Test de vérification du vainqueur en cas de cartes parfaitement identiques, parce que faut bien que ça arrive un jour
    it("Gestion du score cas d'égalité ultime", function() {
        var id = 0;
        assert.strictEqual(sv.player_choice(id, "Thomas", 2), true);
        assert.strictEqual(sv.player_choice(id, "Maximilien", 2), true);
        assert.strictEqual(sv.player_choice(id, "Hannah", 2), true);
        assert.strictEqual(sv.player_choice(id, "Marion", 2), true);
        assert.strictEqual(sv.player_choice(id, "Maxime", 2), true);
        assert.strictEqual(sv.everyone_play(id), true); 
        var mid = sv.choose_mid(id);
        var win = sv.get_winner(id, 16);
        sv.finish_turn(id);
        assert.strictEqual(win.length, 0); // Aucun gagnant car que des égalités
    });

    it("Refuser une carte déjà joué", function() {
        var id = 0;
        assert.strictEqual(sv.player_choice(id, "Thomas", 2), false);
    });

});

describe("Deroulement du tour et score", function() {
    //Test de gestion des scores en cas d'égalité parfaite
    it("Gestion du score cas d'égalité ultime", function() {
        var id = sv.init(2);
        var y = 8;
        assert.strictEqual(sv.ajouter(id, "Maximilien", "bleu"), true);
        assert.strictEqual(sv.ajouter(id, "Hannah", "vert"), true);

        for(var i = 1; i < 16; i++){
            //console.log(y);
            assert.strictEqual(sv.player_choice(id, "Maximilien", i), true);
            if(y <= 15 && y >= 8){
                assert.strictEqual(sv.player_choice(id, "Hannah", y), true);
                y++;
            }
            else if(y == 16){
                y = 1;
                assert.strictEqual(sv.player_choice(id, "Hannah", y), true);
            }
            else{
                y++
                assert.strictEqual(sv.player_choice(id, "Hannah", y), true);
            }
            assert.strictEqual(sv.everyone_play(id), true); 
            var mid = sv.choose_mid(id);
            var win = sv.get_winner(id, 16);
            sv.finish_turn(id);
        }
            var test = sv.get_scores(id);
            //console.log(test);
            assert.strictEqual(sv.player_choice(id, "Hannah", 12), true);
            assert.strictEqual(sv.player_choice(id, "Maximilien", 10), true);
            var mid = sv.choose_mid(id);
            var win = sv.get_winner(id, 16);
            assert.strictEqual(sv.finish_turn(id), 0);

    });
});

describe("Un joueur quitte la partie", function() {

    //Test de vérification de l'ajout de l'IA après que le rageux ait révélé sa vraie nature
    it("Une IA joue contre un joueur", function() {
        var id = sv.init(2, "Maximilien");
        var y = 8;
        assert.strictEqual(sv.ajouter(id, "Maximilien", "bleu"), true);
        assert.strictEqual(sv.ajouter(id, "Hannah", "vert"), true);
        sv.start_game(id, "Maximilien");
        sv.leave(id, "Maximilien");

        for(var i = 1; i < 16; i++){
            //console.log(y);
            assert.strictEqual(sv.player_choice(id, "Hannah", i), true);
            /*if(y <= 15 && y >= 8){
                assert.strictEqual(sv.player_choice(id, "Hannah", y), true);
                y++;
            }else if(y == 16){
                y = 1;
                assert.strictEqual(sv.player_choice(id, "Hannah", y), true);
            }else{
                y++
                assert.strictEqual(sv.player_choice(id, "Hannah", y), true);
            }*/
            assert.strictEqual(sv.everyone_play(id), true); 
            var mid = sv.choose_mid(id);
            var win = sv.get_winner(id, 16);
            sv.finish_turn(id);
        }
            var test = sv.get_scores(id);
            //console.log(test);
            assert.strictEqual(sv.player_choice(id, "Hannah", 12), true);
            assert.strictEqual(sv.player_choice(id, "IA0", 10), true);
            var mid = sv.choose_mid(id);
            var win = sv.get_winner(id, 16);
            assert.strictEqual(sv.finish_turn(id), 0);
    });
});