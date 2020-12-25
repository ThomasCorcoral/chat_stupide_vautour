# Stupide Vautour + Chat
![Preview](https://gitlab.com/l3-webavance/wa-cetre-corcoral/-/raw/master/public/img/baniere.png)


## En quoi consiste ce projet ?
Il s'agit d'un chat sur lequel plusieurs utilisateurs peuvent intéragirs. Afin d'améliorer ce dernier un jeu de société y a été ajouté. Grace à une commande vous pouvez lancer ce dernier et jouer avec vos amis.
Liste des commandes Stupide Vautour :<br>
<pre>- /svautour create [Nombre Tours < 0 et > 6] [Couleur] @invité ...</pre><br>
<pre>- /svautour start [id]</pre><br>
<pre>- /svautour invite [id] @invité</pre><br>
<pre>- /svautour join [id] [Couleur]</pre><br>

## Demo

Une démo via un script Selenium Java est disponible dans le projet. Il vous suffit de lancer le test de votre choix (2 sont disponibles). Pour ce faire veuillez utiliser JUnit (Maven).<br>
/!\ VEUILLEZ REDÉMARRER node . ENTRE CHAQUE TEST, ÉTANT DONNÉ QU'ILS UTILISENT DES ID DE PARTIE IDENTIQUES POUR LES TESTS /!\

## Comment a-t-il été réalisé ?

Notre chat ainsi que notre jeu <a href="https://www.didacto.com/10-ans-et-/1731-stupide-vautour-3421272408320.html" title="Stupide Vautour">Stupide Vautour</a> ont été réalisé avec Javascript. Nous avons mis en place une communication client - serveur avec Node JS.

## Guide d'installation

#### Etape 1

Copiez le projet sur votre ordinateur.

#### Etape 2

Dans le répértoire du fichier, mettez les commandes :
<pre>npm install express --save</pre><br>
<pre>npm install socket.io --save</pre><br>

#### Etape 3

Rendez vous dans le dossier de ce dernier et saisissez la commande <code>node .</code>

#### Etape 4

Connectez-vous à l'adresse localhost:8080

#### Etape 5.1 (option)

Créez un nouveau projet avec maven et mettez ces lignes dans les "dependencies" votre fichier pom.xml<br>

_\<dependency> <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<groupId>junit\</groupId> <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<artifactId>junit\</artifactId> <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<version>4.11\</version> <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<scope>test\</scope> <br>
\</dependency> <br>
\<dependency> <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<groupId>org.seleniumhq.selenium\</groupId> <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<artifactId>selenium-server\</artifactId> <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<version>3.141.59\</version> <br>
\</dependency> <br>_

 
#### Etape 5.2 (option)

Executez le test de votre choix (Attention à bien avoir lancé le serveur node avant)
