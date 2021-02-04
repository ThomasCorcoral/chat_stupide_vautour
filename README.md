# Board game NOW available - www.svautour.thomascorcoral.com/
![Preview](https://github.com/ThomasCorcoral/chat_stupide_vautour/blob/master/svautour.png)


## What is this project? ?
This is a chat on which several users can interact. In order to improve the latter a board game has been added. Thanks to a command you can launch it and play with your friends.
List of commands Stupid Vulture:<br>
<pre>- /svautour create [Numbre of Tunrs < 0 et > 6] [Color] @Name_Invite ...</pre><br>
<pre>- /svautour start [id]</pre><br>
<pre>- /svautour invite [id] @Name_Invite</pre><br>
<pre>- /svautour join [id] [Color]</pre><br>

## Demo

A demo via a Selenium Java script is available in the project. Simply run the test of your choice (2 are available). To do this please use JUnit (Maven).<br>
/!\ PLEASE RESTART `node .` BETWEEN EACH TEST, AS THEY USE IDENTICAL PARTY ID FOR TESTS /!\

## How was it realized?

Our chat and our game have <a href="https://www.didacto.com/10-ans-et-/1731-stupide-vautour-3421272408320.html" title="Stupide Vautour">Stupide Vautour</a> owere made with Javascript. We have set up a client - server communication with Node JS.

## Instalation guide

#### Step 1

Clone the project to your computer.

#### Step 2

In the file folder, put the commands:
<pre>npm install express --save</pre><br>
<pre>npm install socket.io --save</pre><br>

#### Step 3

Go to the folder of the latter and type the command <code>node .</code>

#### Step 4

Connect yourself to the adress localhost:8080

#### Step 5.1 (option)

Create a new project with maven and put these lines in the "dependencies" your file pom.xml<br>

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

 
#### Step 5.2 (option)

Run the test of your choice (Be careful to have launched the node server before)
