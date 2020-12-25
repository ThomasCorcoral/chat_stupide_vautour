package org.tests;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import org.openqa.selenium.*;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.Point;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;

import java.awt.*;
import java.awt.Robot;
import java.awt.event.InputEvent;
import java.awt.event.KeyEvent;
import java.util.concurrent.TimeUnit;


public class TestWebAvance {

    ChatAdapter chat;
    ChatAdapter chat_bis;
    ChatAdapter[] chat_mult = new ChatAdapter[5];
    int id;

    //Teste le déroulement normal d'une partie / chat avec 4 joueurs
    @Test
    public void testScenarioMultipleFour() throws InterruptedException, AWTException {
        id = 0;
        for(int i = 0; i < 4; i++){
            chat_mult[i] = new ChatAdapter(i);
            chat_mult[i].startTest();
        }
        // Initialisation des joueurs, puis les connectent
        for(int i = 0; i < 4; i++){
            String pseudo = "";
            switch (i){
                case 0 : pseudo = "Max"; break;
                case 1 : pseudo = "Pierre"; break;
                case 2 : pseudo = "Hannah"; break;
                case 3 : pseudo = "Thomas"; break;
            }
            chat_mult[i].connexion(pseudo);
        }

        //Simulation de chat tout à fait normal, et pas du tout fait pour booster nos égos
        for(int i = 0; i < 4; i++){
            String msg = "";
            switch (i){
                case 0 : msg = "Salut les loulous"; break;
                case 1 : msg = "Comment ça va ?"; break;
                case 2 : msg = "Très bien et vous ? On jouerait pas à un jeu ?"; break;
                case 3 : msg = "Pourquoi pas essayer le fabuleux jeu de stupide vautour codé par Maximilien et Thomas ?"; break;
            }
            chat_mult[i].write_message(msg);
        }

        //Test extrêmement subtil du mode sombre, encore une fois dans un contexte tout à fait normal
        chat_mult[3].write_mp("Hannah", "J'ai trop mal aux yeux c'est relou !");
        chat_mult[2].write_mp("Thomas", "Active le superbe mode sombre qu'on réalisé nos deux joyeux compères");
        chat_mult[3].turn_dark();
        chat_mult[3].write_mp("Hannah", "Trop bien merci :)");
        chat_mult[0].create_sv("Max");
        chat_mult[1].join_sv("violet", id);
        chat_mult[2].join_sv("rouge", id);
        chat_mult[3].join_sv("jaune", id);
        chat_mult[0].start_sv(id);

        // Des cartes sont jouées, comme dans une partie
        for(int i = 14; i >= 0; i--){
            for(int j = 0; j < 4; j++){
                chat_mult[j].play_card(id, (int)(Math.random() * ((i) + 1)), false);
            }
        }

        //Un joueur fait un excès de seum, et décide de quitter la partie
        int rageux = (int)(Math.random() * ((2) + 1));
        chat_mult[rageux].rager();
        chat_mult[3].write_message("Ouah comment ça rage par ici !");

        // Les autres joueurs continuent à jouer, sauf le giga-rageux, car il a ce qu'il mérite
        for(int i = 14; i >= 0; i--){
            for(int j = 0; j < 4; j++){
                if(j != rageux){
                    chat_mult[j].play_card(id, (int)(Math.random() * ((i) + 1)), false);
                }
            }
        }

        // Les autres joueurs se félicitent, sauf l'omega-rageux, qui commence à saouler de ouf
        for(int j = 0; j < 4; j++){
            if(j != rageux){
                String msg = "";
                switch (j){
                    case 0 : msg = "Bravo"; break;
                    case 1 : msg = "GG MEC"; break;
                    case 2 : msg = "Ouah trop fort"; break;
                    case 3 : msg = "Mes félicitations"; break;
                }
                chat_mult[j].write_message(msg);
            }
        }

        //Fin du test
        for(int i = 0; i < 4; i++){
            if(i != rageux){
                chat_mult[i].endTest();
            }
        }
    }

    //Teste le déroulement normal du chat et de parties en simultanées avec 5 joueurs
    @Test
    public void testScenarioMultiplePartiesFive() throws InterruptedException, AWTException {
        id = 0;
        int id2 = 1;
        for(int i = 0; i < 5; i++){
            chat_mult[i] = new ChatAdapter(i);
            chat_mult[i].startTest();
        }

        // Initialisation des joueurs, puis les connectent
        for(int i = 0; i < 5; i++){
            String pseudo = "";
            switch (i){
                case 0 : pseudo = "Max"; break;
                case 1 : pseudo = "Pierre"; break;
                case 2 : pseudo = "Hannah"; break;
                case 3 : pseudo = "Nino"; break;
                case 4 : pseudo = "Thomas"; break;
            }
            chat_mult[i].connexion(pseudo);
        }
        //Simulation de chat tout à fait normal, et pas du tout fait pour booster nos égos
        for(int i = 0; i < 5; i++){
            String msg = "";
            switch (i){
                case 0 : msg = "Salut les loulous"; break;
                case 1 : msg = "Comment ça va ?"; break;
                case 2 : msg = "Très bien et vous ? On jouerait pas à un jeu ?"; break;
                case 3 : msg = "Pourquoi pas essayer le fabuleux jeu de stupide vautour codé par Maximilien et Thomas ?"; break;
            }
            chat_mult[i].write_message(msg);
        }

        //Test extrêmement subtil du mode sombre, encore une fois dans un contexte tout à fait normal
        chat_mult[4].write_mp("Hannah", "J'ai trop mal aux yeux c'est relou !");
        chat_mult[2].write_mp("Thomas", "Active le superbe mode sombre qu'on réalisé nos deux joyeux compères");
        chat_mult[4].turn_dark();
        chat_mult[4].write_mp("Hannah", "Trop bien merci :)");
        chat_mult[0].create_sv("Max");
        chat_mult[1].join_sv("violet", id);
        chat_mult[2].join_sv("rouge", id);
        chat_mult[4].join_sv("jaune", id);
        chat_mult[0].start_sv(id);

        // Des cartes sont jouées, comme dans une partie, sauf pour Nino qui ne joue pas
        for(int i = 14; i >= 0; i--){
            for(int j = 0; j < 5; j++){
                if(j != 3){ // Nino ne joue pas
                    chat_mult[j].play_card(id, (int)(Math.random() * ((i) + 1)), false);
                }
            }
        }

        //Un joueur fait un excès de seum (sauf Thomas, car il doit faire le héros après), et décide de quitter la partie, et Nino débarque enfin dans le délire
        int rageux;
        do {
            rageux = (int) (Math.random() * ((3) + 1));
        }while(rageux == 3);

        chat_mult[rageux].rager();
        chat_mult[4].write_message("Ouah comment ça rage par ici !");
        chat_mult[3].write_message("Il se passe quoi par ici ? Moi aussi je voulais jouer !!!");
        chat_mult[4].write_mp("Nino", "Vas-y moi je veux bien je peux gérer deux parties en même temps ;)");
        chat_mult[3].write_mp("Thomas", "Trop bien ! Merci je lance la partie :)");
        chat_mult[3].create_sv("Nino"); //création d'une seconde partie
        chat_mult[4].join_sv("violet", id2);
        chat_mult[3].start_sv(id2);

        // Les autres joueurs continuent à jouer, sauf le giga-rageux, car il a ce qu'il mérite, avec en plus Thomas qui joue à 2 parties en même temps, et qui doit switch entre elles
        for(int i = 14; i >= 0; i--){
            for(int j = 0; j < 5; j++){
                if(j != rageux){
                    if(j == 4){
                        chat_mult[j].changer_partie(id);
                        chat_mult[j].play_card(id, (int)(Math.random() * ((i) + 1)), true);
                        chat_mult[j].changer_partie(id2);
                        chat_mult[j].play_card(id2, (int)(Math.random() * ((i) + 1)), true);
                    }else if(j == 3){
                        chat_mult[j].play_card(id2, (int)(Math.random() * ((i) + 1)), false);
                    }else{
                        chat_mult[j].play_card(id, (int)(Math.random() * ((i) + 1)), false);
                    }
                }
            }
        }

        // Les autres joueurs se félicitent, sauf l'omega-rageux, qui commence à saouler de ouf
        for(int j = 0; j < 5; j++){
            if(j != rageux){
                String msg = "";
                switch (j){
                    case 0 : msg = "Bravo"; break;
                    case 1 : msg = "GG MEC"; break;
                    case 2 : msg = "Ouah trop fort"; break;
                    case 3 : msg = "Mes félicitations"; break;
                }
                chat_mult[j].write_message(msg);
            }
        }

        //Fin du test
        for(int i = 0; i < 5; i++){
            if(i != rageux){
                chat_mult[i].endTest();
            }
        }
    }

}

class ChatAdapter {

    /** Web driver used to send the commands **/
    private WebDriver driver;

    /**
     * Constructor for Metro Adapter.
     */
    public ChatAdapter(int i) {
        //System.setProperty("webdriver.chrome.driver", "/home/thomas/Documents/Etudes/L3/S5/Outils_prog/chromedriver");
        System.setProperty("webdriver.chrome.driver", "C:/Users/Nelimix/IdeaProjects/chromedriver.exe");
        ChromeOptions chromeOptions = new ChromeOptions();
        //chromeOptions.addArguments("--headless"); // Pour ne pas afficher la fenêtre
        driver = new ChromeDriver(chromeOptions);
        java.awt.Dimension dim = Toolkit.getDefaultToolkit().getScreenSize();
        /*int x = 0;
        int y = 0;
        switch (i){
            case 0 : break;
            case 1 : x = dim.width/2+30; break;
            case 2 : y = dim.height/2; break;
            case 3 : x = dim.width/2+30; y = dim.height/2; break;
        }
        driver.manage().window().setPosition(new Point(x,y));
        if(i != 3){driver.manage().window().setSize(new Dimension(dim.width/2-30, dim.height/2));}
        else{driver.manage().window().setSize(new Dimension(dim.width, dim.height));}*/
        driver.manage().window().setPosition(new Point(0,0));
        driver.manage().window().setSize(new Dimension(dim.width, dim.height));
        driver.manage().timeouts().implicitlyWait(1, TimeUnit.SECONDS);
    }

     /**
     * Start a test by opening the URL.
     */
    public void startTest() {
        //driver.get("https://fdadeau.github.io/velocity");
        driver.get("http://localhost:8080/");
        wait(2000);
    }
    /**
     * Ends a test by closing the tab.
     */
    public void endTest() {
        driver.close();
        driver.quit();  // à enlever avec le plugin Firefox
    }

    /**
     * Message de rageux classique, quelle mauvaise foi je vous jure...
     */
    public void rager(){
        write_message("C'est bon! C'est pourri comme jeu, je me casse !!!!");
        endTest();
    }

    /**
     * Permet de changer de partie dans le test MultipleParties
     *
     * @param id    L'id de la partie
     */
    public void changer_partie(int id){
        Actions actions = new Actions(driver);
        WebElement menuOption = driver.findElement(By.id("dropdown"));
        actions.moveToElement(menuOption).perform();
        wait(250);
        driver.findElement(By.id("mchoice" + id)).click();
        wait(250);
    }

    /**
     * Se connecte avec le pseudo donné en paramètre
     *
     * @param pseudo    Le pseudo voulu
     */
    public void connexion(String pseudo){
        driver.findElement(By.id("pseudo")).click();
        for(char c : pseudo.toCharArray()){
            driver.findElement(By.id("pseudo")).sendKeys(String.valueOf(c));
            wait(10 + (int)(Math.random() * ((30 - 10) + 1)));
        }
        wait(200);
        driver.findElement(By.id("btnConnecter")).click();
    }

    /**
     * Permet de jouer une carte
     *
     * @param id    L'id de la partie
     * @param card  La carte à jouer
     * @param turn  Indique qu'il s'agit, ou non, du tour de la personne
     * @throws AWTException En cas de problème avec la fênetre
     */
    public void play_card(int id, int card, boolean turn) throws AWTException {
        WebElement carte;
        if(turn){
            wait(1000);
        }
        if(card == 0){
            carte = driver.findElement(By.xpath(("//div[@id='" + id + "plh']/img")));
        }else{
            carte = driver.findElement(By.xpath(("//div[@id='" + id + "plh']/img[" + card + "]")));
        }
        Actions action = new Actions(driver);
        action.moveToElement(carte, 2, 2).click().build().perform();
        wait(350);
        if(turn){
            wait(1000);
        }
    }

    /**
     * Permet d'activer la dictée vocal, NE FONCTIONNE PAS (?)
     */
    public void turn_sound(){
        wait(250);
        driver.findElement(By.id("son_on")).click();
        wait(250);
    }

    /**
     * Permet de lancer la parie préparée
     *
     * @param id    L'id de la partie
     */
    public void start_sv(int id){
        WebElement start_but = driver.findElement(By.id(id + "start"));
        start_but.click();
        wait(250);
    }

    /**
     * Fonction qui permet d'écrire un message dans le chat et de l'envoyer
     *
     * @param msg String message à envoyer
     */
    public void write_message(String msg){
        driver.findElement(By.id("monMessage")).click();
        wait(250);
        for(char c : msg.toCharArray()){
            driver.findElement(By.id("monMessage")).sendKeys(String.valueOf(c));
            wait(5 + (int)(Math.random() * ((15 - 5) + 1)));
        }
        wait(100);
        driver.findElement(By.id("btnEnvoyer")).click();
    }

    /**
     * Fonction qui permet de passer en mode sombre avec la combinaison de touches d+a+r+k puis de valider l'alerte
     *
     * @throws AWTException En cas de problème avec le robot
     */
    public void turn_dark() throws AWTException {
        wait(2000);
        Robot rb = new Robot();
        rb.keyPress(KeyEvent.VK_D);
        rb.keyPress(KeyEvent.VK_A);
        rb.keyPress(KeyEvent.VK_R);
        rb.keyPress(KeyEvent.VK_K);
        wait(300);
        rb.keyRelease(KeyEvent.VK_D);
        rb.keyRelease(KeyEvent.VK_A);
        rb.keyRelease(KeyEvent.VK_R);
        rb.keyRelease(KeyEvent.VK_K);
        wait(300);
        rb.keyPress(KeyEvent.VK_ENTER);
        wait(300);
        rb.keyRelease(KeyEvent.VK_ENTER);
        wait(500);
    }

    /**
     * Fonction qui permet d'écrire un message privé et de l'envoyer
     *
     * @param msg String message à envoyer
     */
    public void write_mp(String pseudo, String msg){
        String m = "@" + pseudo + " " + msg;
        driver.findElement(By.id("monMessage")).click();
        wait(250);
        for(char c : m.toCharArray()){
            driver.findElement(By.id("monMessage")).sendKeys(String.valueOf(c));
            wait(5 + (int)(Math.random() * ((15 - 5) + 1)));
        }
        wait(100);
        driver.findElement(By.id("btnEnvoyer")).click();
    }

    /**
     * Lance la commande de création du jeu en invitant tous les autres participants
     *
     * @param owner String nom du créateur
     */
    public void create_sv(String owner){
        String msg = "";
        switch(owner){
            case "Max" : msg = "/svautour create 2 bleu @Thomas @Hannah @Pierre"; break;
            case "Thomas" : msg = "/svautour create 2 bleu @Max @Hannah @Pierre"; break;
            case "Hannah" : msg = "/svautour create 2 bleu @Thomas @Max @Pierre"; break;
            case "Pierre" : msg = "/svautour create 2 bleu @Thomas @Hannah @Max"; break;
            case "Nino" : msg = "/svautour create 1 bleu @Thomas"; break;
        }
        driver.findElement(By.id("monMessage")).click();
        wait(250);
        for(char c : msg.toCharArray()){
            driver.findElement(By.id("monMessage")).sendKeys(String.valueOf(c));
            wait(5 + (int)(Math.random() * ((15 - 5) + 1)));
        }
        wait(800);
        driver.findElement(By.id("btnEnvoyer")).click();
    }

    /**
     * Cherche les boutons pour afficher la commande dans le chat, et celui pour envoyer un message.
     * Complète la commande envoyée par le bouton répondre en supprimant le [couleur] et le remplace par une couleur disponible
     * @param color     Les couleurs disponibles
     * @param id        L'id de la partie
     */
    public void join_sv(String color, int id){
        driver.findElement(By.id(id +"btnRepondre")).click();
        driver.findElement(By.id("monMessage")).click();
        for(int i = 0 ; i < 9; i++){
            driver.findElement(By.id("monMessage")).sendKeys(Keys.BACK_SPACE);
            wait(5 + (int)(Math.random() * ((30 - 5) + 1)));
        }
        wait(250);
        for(char c : color.toCharArray()){
            driver.findElement(By.id("monMessage")).sendKeys(String.valueOf(c));
            wait(5 + (int)(Math.random() * ((15 - 5) + 1)));
        }
        wait(800);
        driver.findElement(By.id("btnEnvoyer")).click();
    }

    /**
     * Utility function to pause the test execution.
     * (to wait for loading, or others actions to end)
     * @param ms the waiting time in milliseconds.
     */
    private static void wait(int ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Assert.fail("Test case interrupted");
        }

    }


}

