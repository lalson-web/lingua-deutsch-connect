/* =========================================================
   LINGUA DEUTSCH CONNECT
   VOCABULARY
   =========================================================
   1,380+ unique German vocabulary entries
   Levels: A1, A2, B1, B2
   ========================================================= */

"use strict";

const API_URL = "/api";

const STUDENT_TOKEN_KEY = "ldc_token";
const STUDENT_DATA_KEY = "ldc_student";
const FAVORITES_KEY = "ldc_vocabulary_favorites";
const VOCAB_STATS_KEY = "ldc_vocabulary_stats";
const WORDS_PER_BATCH = 60;

/* =========================================================
   VOCABULARY DATABASE
   Format:
   level|category|type|word|english|article|plural
========================================================= */

const vocabularySeed = [
"A1|Alltag|Wort|Abend|evening||",
"A1|Alltag|Wort|Adresse|address||",
"A1|Alltag|Wort|Alter|age||",
"A1|Alltag|Wort|Anfang|beginning||",
"A1|Alltag|Wort|Antwort|answer||",
"A1|Alltag|Wort|Apfel|apple||",
"A1|Alltag|Wort|Apotheke|pharmacy||",
"A1|Alltag|Wort|Arbeit|work||",
"A1|Alltag|Wort|Aufgabe|task||",
"A1|Alltag|Wort|Auge|eye||",
"A1|Alltag|Wort|Baby|baby||",
"A1|Alltag|Wort|Bäckerei|bakery||",
"A1|Alltag|Wort|Bahnhof|train station||",
"A1|Alltag|Wort|Bahnsteig|platform||",
"A1|Alltag|Wort|Balkon|balcony||",
"A1|Alltag|Wort|Banane|banana||",
"A1|Alltag|Wort|Bank|bank||",
"A1|Alltag|Wort|Bauch|belly||",
"A1|Alltag|Wort|Baum|tree||",
"A1|Alltag|Wort|Beispiel|example||",
"A1|Alltag|Wort|Bett|bed||",
"A1|Alltag|Wort|Bibliothek|library||",
"A1|Alltag|Wort|Bild|picture||",
"A1|Alltag|Wort|Blume|flower||",
"A1|Alltag|Wort|Bluse|blouse||",
"A1|Alltag|Wort|Boden|floor||",
"A1|Alltag|Wort|Brief|letter||",
"A1|Alltag|Wort|Brille|glasses||",
"A1|Alltag|Wort|Brot|bread||",
"A1|Alltag|Wort|Bruder|brother||",
"A1|Alltag|Wort|Buch|book||",
"A1|Alltag|Wort|Bus|bus||",
"A1|Alltag|Wort|Café|cafe||",
"A1|Alltag|Wort|Computer|computer||",
"A1|Alltag|Wort|Datum|date||",
"A1|Alltag|Wort|Dezember|December||",
"A1|Alltag|Wort|Dienstag|Tuesday||",
"A1|Alltag|Wort|Dorf|village||",
"A1|Alltag|Wort|Dusche|shower||",
"A1|Alltag|Wort|E-Mail|email||",
"A1|Alltag|Wort|Ei|egg||",
"A1|Alltag|Wort|Eingang|entrance||",
"A1|Alltag|Wort|Eis|ice cream||",
"A1|Alltag|Wort|Ende|end||",
"A1|Alltag|Wort|Erdbeere|strawberry||",
"A1|Alltag|Wort|Essen|food, meal||",
"A1|Alltag|Wort|Fahrkarte|transport ticket||",
"A1|Alltag|Wort|Fahrrad|bicycle||",
"A1|Alltag|Wort|Familie|family||",
"A1|Alltag|Wort|Farbe|color||",
"A1|Alltag|Wort|Fehler|mistake||",
"A1|Alltag|Wort|Feier|celebration||",
"A1|Alltag|Wort|Fenster|window||",
"A1|Alltag|Wort|Ferien|holidays||",
"A1|Alltag|Wort|Fernseher|television||",
"A1|Alltag|Wort|Fest|party, festival||",
"A1|Alltag|Wort|Feuer|fire||",
"A1|Alltag|Wort|Fisch|fish||",
"A1|Alltag|Wort|Flasche|bottle||",
"A1|Alltag|Wort|Fleisch|meat||",
"A1|Alltag|Wort|Flughafen|airport||",
"A1|Alltag|Wort|Flugzeug|airplane||",
"A1|Alltag|Wort|Fluss|river||",
"A1|Alltag|Wort|Frage|question||",
"A1|Alltag|Wort|Frau|woman||",
"A1|Alltag|Wort|Freitag|Friday||",
"A1|Alltag|Wort|Freizeit|free time||",
"A1|Alltag|Wort|Freund|friend||",
"A1|Alltag|Wort|Freundin|female friend||",
"A1|Alltag|Wort|Frühling|spring||",
"A1|Alltag|Wort|Frühstück|breakfast||",
"A1|Alltag|Wort|Fuß|foot||",
"A1|Alltag|Wort|Fußball|football||",
"A1|Alltag|Wort|Gabel|fork||",
"A1|Alltag|Wort|Garten|garden||",
"A1|Alltag|Wort|Gast|guest||",
"A1|Alltag|Wort|Gebäude|building||",
"A1|Alltag|Wort|Geburtstag|birthday||",
"A1|Alltag|Wort|Geld|money||",
"A1|Alltag|Wort|Gemüse|vegetables||",
"A1|Alltag|Wort|Gepäck|luggage||",
"A1|Alltag|Wort|Geschäft|shop||",
"A1|Alltag|Wort|Geschenk|gift||",
"A1|Alltag|Wort|Geschichte|story, history||",
"A1|Alltag|Wort|Geschwister|siblings||",
"A1|Alltag|Wort|Gesicht|face||",
"A1|Alltag|Wort|Getränk|drink||",
"A1|Alltag|Wort|Glas|glass||",
"A1|Alltag|Wort|Glück|luck, happiness||",
"A1|Alltag|Wort|Großeltern|grandparents||",
"A1|Alltag|Wort|Großmutter|grandmother||",
"A1|Alltag|Wort|Großvater|grandfather||",
"A1|Alltag|Wort|Gruß|greeting||",
"A1|Alltag|Wort|Haar|hair||",
"A1|Alltag|Wort|Halle|hall||",
"A1|Alltag|Wort|Haltestelle|stop||",
"A1|Alltag|Wort|Hand|hand||",
"A1|Alltag|Wort|Handy|mobile phone||",
"A1|Alltag|Wort|Hauptbahnhof|main train station||",
"A1|Alltag|Wort|Haus|house||",
"A1|Alltag|Wort|Hausaufgabe|homework||",
"A1|Alltag|Wort|Haushalt|household||",
"A1|Alltag|Wort|Heimat|homeland||",
"A1|Alltag|Wort|Herr|Mr., gentleman||",
"A1|Alltag|Wort|Hilfe|help||",
"A1|Alltag|Wort|Himmel|sky||",
"A1|Alltag|Wort|Hobby|hobby||",
"A1|Alltag|Wort|Hochzeit|wedding||",
"A1|Alltag|Wort|Hotel|hotel||",
"A1|Alltag|Wort|Hund|dog||",
"A1|Alltag|Wort|Hunger|hunger||",
"A1|Alltag|Wort|Idee|idea||",
"A1|Alltag|Wort|Information|information||",
"A1|Alltag|Wort|Ingenieur|engineer||",
"A1|Alltag|Wort|Internet|internet||",
"A1|Alltag|Wort|Januar|January||",
"A1|Alltag|Wort|Kaffee|coffee||",
"A1|Alltag|Wort|Karte|card, map||",
"A1|Alltag|Wort|Käse|cheese||",
"A1|Alltag|Wort|Kind|child||",
"A1|Alltag|Wort|Kino|cinema||",
"A1|Alltag|Wort|Kirche|church||",
"A1|Alltag|Wort|Kleid|dress||",
"A1|Alltag|Wort|Kleidung|clothing||",
"A1|Alltag|Wort|Kopf|head||",
"A1|Alltag|Wort|Küche|kitchen||",
"A1|Alltag|Wort|Kuchen|cake||",
"A1|Alltag|Wort|Laden|shop||",
"A1|Alltag|Wort|Lampe|lamp||",
"A1|Alltag|Wort|Land|country||",
"A1|Alltag|Wort|Leben|life||",
"A1|Alltag|Wort|Lehrer|teacher||",
"A1|Alltag|Wort|Lehrerin|female teacher||",
"A1|Alltag|Wort|Leute|people||",
"A1|Alltag|Wort|Lied|song||",
"A1|Alltag|Wort|Luft|air||",
"A1|Alltag|Wort|Mädchen|girl||",
"A1|Alltag|Wort|Mann|man||",
"A1|Alltag|Wort|Markt|market||",
"A1|Alltag|Wort|Medikament|medicine||",
"A1|Alltag|Wort|Meer|sea||",
"A1|Alltag|Wort|Mittagessen|lunch||",
"A1|Alltag|Wort|Mittwoch|Wednesday||",
"A1|Alltag|Wort|Monat|month||",
"A1|Alltag|Wort|Morgen|morning||",
"A1|Alltag|Wort|Mutter|mother||",
"A1|Alltag|Wort|Name|name||",
"A1|Alltag|Wort|Nacht|night||",
"A1|Alltag|Wort|Nachmittag|afternoon||",
"A1|Alltag|Wort|Nachbar|neighbor||",
"A1|Alltag|Wort|Nachbarin|female neighbor||",
"A1|Alltag|Wort|Nase|nose||",
"A1|Alltag|Wort|Nummer|number||",
"A1|Alltag|Wort|Ohr|ear||",
"A1|Alltag|Wort|Onkel|uncle||",
"A1|Alltag|Wort|Ort|place||",
"A1|Alltag|Wort|Paar|pair, couple||",
"A1|Alltag|Wort|Papier|paper||",
"A1|Alltag|Wort|Park|park||",
"A1|Alltag|Wort|Party|party||",
"A1|Alltag|Wort|Pass|passport||",
"A1|Alltag|Wort|Pause|break||",
"A1|Alltag|Wort|Person|person||",
"A1|Alltag|Wort|Pflanze|plant||",
"A1|Alltag|Wort|Polizei|police||",
"A1|Alltag|Wort|Post|mail, post||",
"A1|Alltag|Wort|Postkarte|postcard||",
"A1|Alltag|Wort|Preis|price||",
"A1|Alltag|Wort|Problem|problem||",
"A1|Alltag|Wort|Prüfung|exam||",
"A1|Alltag|Wort|Radio|radio||",
"A1|Alltag|Wort|Reise|trip||",
"A1|Alltag|Wort|Restaurant|restaurant||",
"A1|Alltag|Wort|Rücken|back||",
"A1|Alltag|Wort|Sache|thing||",
"A1|Alltag|Wort|Schlafzimmer|bedroom||",
"A1|Alltag|Wort|Schlüssel|key||",
"A1|Alltag|Wort|Schrank|wardrobe||",
"A1|Alltag|Wort|Schule|school||",
"A1|Alltag|Wort|Schüler|student||",
"A1|Alltag|Wort|Schülerin|female student||",
"A1|Alltag|Wort|Schuh|shoe||",
"A1|Alltag|Wort|Schwester|sister||",
"A1|Alltag|Wort|See|lake||",
"A1|Alltag|Wort|Seite|page, side||",
"A1|Alltag|Wort|Sofa|sofa||",
"A1|Alltag|Wort|Sommer|summer||",
"A1|Alltag|Wort|Sonne|sun||",
"A1|Alltag|Wort|Sonntag|Sunday||",
"A1|Alltag|Wort|Speisekarte|menu||",
"A1|Alltag|Wort|Sport|sport||",
"A1|Alltag|Wort|Sprache|language||",
"A1|Alltag|Wort|Stadt|city||",
"A1|Alltag|Wort|Straße|street||",
"A1|Alltag|Wort|Student|student||",
"A1|Alltag|Wort|Studentin|female student||",
"A1|Alltag|Wort|Stunde|hour||",
"A1|Alltag|Wort|Supermarkt|supermarket||",
"A1|Alltag|Wort|Tasche|bag||",
"A1|Alltag|Wort|Tante|aunt||",
"A1|Alltag|Wort|Tee|tea||",
"A1|Alltag|Wort|Telefon|telephone||",
"A1|Alltag|Wort|Tisch|table||",
"A1|Alltag|Wort|Tochter|daughter||",
"A1|Alltag|Wort|Toilette|toilet||",
"A1|Alltag|Wort|Tür|door||",
"A1|Alltag|Wort|Uhr|clock||",
"A1|Alltag|Wort|Urlaub|holiday||",
"A1|Alltag|Wort|Vater|father||",
"A1|Alltag|Wort|Verein|club, association||",
"A1|Alltag|Wort|Verkehr|traffic||",
"A1|Alltag|Wort|Wasser|water||",
"A1|Alltag|Wort|Weg|way, path||",
"A1|Alltag|Wort|Wetter|weather||",
"A1|Alltag|Wort|Woche|week||",
"A1|Alltag|Wort|Wohnung|apartment||",
"A1|Alltag|Wort|Wort|word||",
"A1|Alltag|Wort|Zahl|number||",
"A1|Alltag|Wort|Zahn|tooth||",
"A1|Alltag|Wort|Zeit|time||",
"A1|Alltag|Wort|Zeitung|newspaper||",
"A1|Alltag|Wort|Zentrum|center||",
"A1|Alltag|Wort|Zimmer|room||",
"A1|Alltag|Wort|Zug|train||",
"A1|Alltag|Wort|Zucker|sugar||",

"A1|Alltag|Verb|abfahren|to depart||",
"A1|Alltag|Verb|abholen|to pick up||",
"A1|Alltag|Verb|anfangen|to begin||",
"A1|Alltag|Verb|anrufen|to call||",
"A1|Alltag|Verb|antworten|to answer||",
"A1|Alltag|Verb|arbeiten|to work||",
"A1|Alltag|Verb|aussehen|to look||",
"A1|Alltag|Verb|aussteigen|to get off||",
"A1|Alltag|Verb|bekommen|to get||",
"A1|Alltag|Verb|benutzen|to use||",
"A1|Alltag|Verb|bezahlen|to pay||",
"A1|Alltag|Verb|bleiben|to stay||",
"A1|Alltag|Verb|brauchen|to need||",
"A1|Alltag|Verb|bringen|to bring||",
"A1|Alltag|Verb|denken|to think||",
"A1|Alltag|Verb|dauern|to last||",
"A1|Alltag|Verb|dürfen|to be allowed||",
"A1|Alltag|Verb|essen|to eat||",
"A1|Alltag|Verb|fahren|to drive, go||",
"A1|Alltag|Verb|fehlen|to be missing||",
"A1|Alltag|Verb|fernsehen|to watch TV||",
"A1|Alltag|Verb|finden|to find||",
"A1|Alltag|Verb|fliegen|to fly||",
"A1|Alltag|Verb|fragen|to ask||",
"A1|Alltag|Verb|freuen|to be happy||",
"A1|Alltag|Verb|fühlen|to feel||",
"A1|Alltag|Verb|geben|to give||",
"A1|Alltag|Verb|gefallen|to please||",
"A1|Alltag|Verb|gehen|to go||",
"A1|Alltag|Verb|haben|to have||",
"A1|Alltag|Verb|heißen|to be called||",
"A1|Alltag|Verb|helfen|to help||",
"A1|Alltag|Verb|kaufen|to buy||",
"A1|Alltag|Verb|kommen|to come||",
"A1|Alltag|Verb|kochen|to cook||",
"A1|Alltag|Verb|kosten|to cost||",
"A1|Alltag|Verb|leben|to live||",
"A1|Alltag|Verb|legen|to lay||",
"A1|Alltag|Verb|lernen|to learn||",
"A1|Alltag|Verb|machen|to do, make||",
"A1|Alltag|Verb|nehmen|to take||",
"A1|Alltag|Verb|öffnen|to open||",
"A1|Alltag|Verb|putzen|to clean||",
"A1|Alltag|Verb|reden|to talk||",
"A1|Alltag|Verb|reisen|to travel||",
"A1|Alltag|Verb|schlafen|to sleep||",
"A1|Alltag|Verb|schreiben|to write||",
"A1|Alltag|Verb|schwimmen|to swim||",
"A1|Alltag|Verb|sehen|to see||",
"A1|Alltag|Verb|sein|to be||",
"A1|Alltag|Verb|sitzen|to sit||",
"A1|Alltag|Verb|spielen|to play||",
"A1|Alltag|Verb|sprechen|to speak||",
"A1|Alltag|Verb|stehen|to stand||",
"A1|Alltag|Verb|studieren|to study||",
"A1|Alltag|Verb|suchen|to search||",
"A1|Alltag|Verb|tanzen|to dance||",
"A1|Alltag|Verb|tragen|to wear||",
"A1|Alltag|Verb|treffen|to meet||",
"A1|Alltag|Verb|trinken|to drink||",
"A1|Alltag|Verb|tun|to do||",
"A1|Alltag|Verb|vergessen|to forget||",
"A1|Alltag|Verb|verkaufen|to sell||",
"A1|Alltag|Verb|verstehen|to understand||",
"A1|Alltag|Verb|warten|to wait||",
"A1|Alltag|Verb|waschen|to wash||",
"A1|Alltag|Verb|wohnen|to live, reside||",
"A1|Alltag|Verb|zeigen|to show||",

"A1|Alltag|Adjektiv|alt|old||",
"A1|Alltag|Adjektiv|anders|different||",
"A1|Alltag|Adjektiv|allein|alone||",
"A1|Alltag|Adjektiv|bald|soon||",
"A1|Alltag|Adjektiv|billig|cheap||",
"A1|Alltag|Adjektiv|blau|blue||",
"A1|Alltag|Adjektiv|braun|brown||",
"A1|Alltag|Adjektiv|dick|thick||",
"A1|Alltag|Adjektiv|dunkel|dark||",
"A1|Alltag|Adjektiv|einfach|simple||",
"A1|Alltag|Adjektiv|fertig|finished||",
"A1|Alltag|Adjektiv|frei|free||",
"A1|Alltag|Adjektiv|fremd|foreign||",
"A1|Alltag|Adjektiv|frisch|fresh||",
"A1|Alltag|Adjektiv|früh|early||",
"A1|Alltag|Adjektiv|freundlich|friendly||",
"A1|Alltag|Adjektiv|froh|glad||",
"A1|Alltag|Adjektiv|gesund|healthy||",
"A1|Alltag|Adjektiv|genau|exact||",
"A1|Alltag|Adjektiv|geschlossen|closed||",
"A1|Alltag|Adjektiv|glücklich|happy||",
"A1|Alltag|Adjektiv|grau|gray||",
"A1|Alltag|Adjektiv|groß|big||",
"A1|Alltag|Adjektiv|grün|green||",
"A1|Alltag|Adjektiv|gut|good||",
"A1|Alltag|Adjektiv|heiß|hot||",
"A1|Alltag|Adjektiv|hell|bright||",
"A1|Alltag|Adjektiv|hoch|high||",
"A1|Alltag|Adjektiv|interessant|interesting||",
"A1|Alltag|Adjektiv|kalt|cold||",
"A1|Alltag|Adjektiv|klein|small||",
"A1|Alltag|Adjektiv|krank|ill||",
"A1|Alltag|Adjektiv|lang|long||",
"A1|Alltag|Adjektiv|lecker|tasty||",
"A1|Alltag|Adjektiv|leicht|easy||",
"A1|Alltag|Adjektiv|neu|new||",
"A1|Alltag|Adjektiv|nett|nice||",
"A1|Alltag|Adjektiv|richtig|correct||",
"A1|Alltag|Adjektiv|rot|red||",
"A1|Alltag|Adjektiv|ruhig|quiet||",
"A1|Alltag|Adjektiv|schlecht|bad||",
"A1|Alltag|Adjektiv|schön|beautiful||",
"A1|Alltag|Adjektiv|schwer|difficult||",
"A1|Alltag|Adjektiv|schwarz|black||",
"A1|Alltag|Adjektiv|schnell|fast||",
"A1|Alltag|Adjektiv|spät|late||",
"A1|Alltag|Adjektiv|teuer|expensive||",
"A1|Alltag|Adjektiv|traurig|sad||",
"A1|Alltag|Adjektiv|warm|warm||",
"A1|Alltag|Adjektiv|weiß|white||",
"A1|Alltag|Adjektiv|wichtig|important||",
"A1|Alltag|Adjektiv|wunderbar|wonderful||",

"A1|Kommunikation|Ausdruck|ab|from||",
"A1|Kommunikation|Ausdruck|aber|but||",
"A1|Kommunikation|Ausdruck|also|so||",
"A1|Kommunikation|Ausdruck|auch|also||",
"A1|Kommunikation|Ausdruck|auf|on||",
"A1|Kommunikation|Ausdruck|aus|from, out of||",
"A1|Kommunikation|Ausdruck|bei|at, near||",
"A1|Kommunikation|Ausdruck|bis|until||",
"A1|Kommunikation|Ausdruck|da|there||",
"A1|Kommunikation|Ausdruck|danke|thank you||",
"A1|Kommunikation|Ausdruck|dann|then||",
"A1|Kommunikation|Ausdruck|denn|because||",
"A1|Kommunikation|Ausdruck|durch|through||",
"A1|Kommunikation|Ausdruck|egal|it doesn't matter||",
"A1|Kommunikation|Ausdruck|erst|first||",
"A1|Kommunikation|Ausdruck|etwas|something||",
"A1|Kommunikation|Ausdruck|fast|almost||",
"A1|Kommunikation|Ausdruck|für|for||",
"A1|Kommunikation|Ausdruck|gegen|against||",
"A1|Kommunikation|Ausdruck|gerade|just now||",
"A1|Kommunikation|Ausdruck|gern|gladly||",
"A1|Kommunikation|Ausdruck|gestern|yesterday||",
"A1|Kommunikation|Ausdruck|heute|today||",
"A1|Kommunikation|Ausdruck|hier|here||",
"A1|Kommunikation|Ausdruck|immer|always||",
"A1|Kommunikation|Ausdruck|in|in||",
"A1|Kommunikation|Ausdruck|ja|yes||",
"A1|Kommunikation|Ausdruck|jetzt|now||",
"A1|Kommunikation|Ausdruck|kein|no, not a||",
"A1|Kommunikation|Ausdruck|man|one, people||",
"A1|Kommunikation|Ausdruck|mit|with||",
"A1|Kommunikation|Ausdruck|nach|to, after||",
"A1|Kommunikation|Ausdruck|nein|no||",
"A1|Kommunikation|Ausdruck|noch|still, yet||",
"A1|Kommunikation|Ausdruck|nur|only||",
"A1|Kommunikation|Ausdruck|oder|or||",
"A1|Kommunikation|Ausdruck|ohne|without||",
"A1|Kommunikation|Ausdruck|sehr|very||",
"A1|Kommunikation|Ausdruck|so|so||",
"A1|Kommunikation|Ausdruck|über|over, about||",
"A1|Kommunikation|Ausdruck|um|around, at||",
"A1|Kommunikation|Ausdruck|und|and||",
"A1|Kommunikation|Ausdruck|von|from, of||",
"A1|Kommunikation|Ausdruck|vor|before||",
"A1|Kommunikation|Ausdruck|warum|why||",
"A1|Kommunikation|Ausdruck|was|what||",
"A1|Kommunikation|Ausdruck|weil|because||",
"A1|Kommunikation|Ausdruck|wenn|if, when||",
"A1|Kommunikation|Ausdruck|wie|how||",
"A1|Kommunikation|Ausdruck|wieder|again||",
"A1|Kommunikation|Ausdruck|wo|where||",
"A1|Kommunikation|Ausdruck|woher|where from||",
"A1|Kommunikation|Ausdruck|wohin|where to||",
"A1|Kommunikation|Ausdruck|zu|to||",
"A1|Kommunikation|Ausdruck|zusammen|together||",
"A1|Kommunikation|Ausdruck|zurück|back||",

"A2|Alltag|Wort|Abwesenheit|absence||",
"A2|Alltag|Wort|Abwechslung|variety||",
"A2|Alltag|Wort|Ahnung|idea, clue||",
"A2|Alltag|Wort|Angebot|offer||",
"A2|Alltag|Wort|Ankunft|arrival||",
"A2|Alltag|Wort|Anmeldung|registration||",
"A2|Alltag|Wort|Anruf|call||",
"A2|Alltag|Wort|Ansicht|view||",
"A2|Alltag|Wort|Antwort|answer||",
"A2|Alltag|Wort|Anweisung|instruction||",
"A2|Alltag|Wort|Anzeige|advertisement||",
"A2|Alltag|Wort|Ausdruck|expression||",
"A2|Alltag|Wort|Ausgabe|edition, output||",
"A2|Alltag|Wort|Ausland|abroad||",
"A2|Alltag|Wort|Ausnahme|exception||",
"A2|Alltag|Wort|Aussage|statement||",
"A2|Alltag|Wort|Auswahl|selection||",
"A2|Alltag|Wort|Bedarf|need||",
"A2|Alltag|Wort|Bedeutung|meaning||",
"A2|Alltag|Wort|Behandlung|treatment||",
"A2|Alltag|Wort|Beitrag|contribution||",
"A2|Alltag|Wort|Bewegung|movement||",
"A2|Alltag|Wort|Beziehung|relationship||",
"A2|Alltag|Wort|Bescheid|notice, information||",
"A2|Alltag|Wort|Besuch|visit||",
"A2|Alltag|Wort|Betrag|amount||",
"A2|Alltag|Wort|Betrieb|business, operation||",
"A2|Alltag|Wort|Chance|chance||",
"A2|Alltag|Wort|Dank|thanks||",
"A2|Alltag|Wort|Dienst|service||",
"A2|Alltag|Wort|Druck|pressure, print||",
"A2|Alltag|Wort|Einladung|invitation||",
"A2|Alltag|Wort|Einwohner|resident||",
"A2|Alltag|Wort|Entscheidung|decision||",
"A2|Alltag|Wort|Ergebnis|result||",
"A2|Alltag|Wort|Erinnerung|memory||",
"A2|Alltag|Wort|Erlaubnis|permission||",
"A2|Alltag|Wort|Erklärung|explanation||",
"A2|Alltag|Wort|Erfahrung|experience||",
"A2|Alltag|Wort|Ersatz|replacement||",
"A2|Alltag|Wort|Fahrt|journey, ride||",
"A2|Alltag|Wort|Fortschritt|progress||",
"A2|Alltag|Wort|Gebiet|area||",
"A2|Alltag|Wort|Gedanke|thought||",
"A2|Alltag|Wort|Gefahr|danger||",
"A2|Alltag|Wort|Gefühl|feeling||",
"A2|Alltag|Wort|Gegend|area, region||",
"A2|Alltag|Wort|Gewohnheit|habit||",
"A2|Alltag|Wort|Grund|reason||",
"A2|Alltag|Wort|Hälfte|half||",
"A2|Alltag|Wort|Inhalt|content||",
"A2|Alltag|Wort|Interesse|interest||",
"A2|Alltag|Wort|Konto|account||",
"A2|Alltag|Wort|Kontakt|contact||",
"A2|Alltag|Wort|Kraft|strength||",
"A2|Alltag|Wort|Lärm|noise||",
"A2|Alltag|Wort|Möglichkeit|possibility||",
"A2|Alltag|Wort|Nachricht|message||",
"A2|Alltag|Wort|Nachteil|disadvantage||",
"A2|Alltag|Wort|Nutzen|benefit||",
"A2|Alltag|Wort|Ordnung|order||",
"A2|Alltag|Wort|Planung|planning||",
"A2|Alltag|Wort|Reparatur|repair||",
"A2|Alltag|Wort|Ruhe|quiet||",
"A2|Alltag|Wort|Schutz|protection||",
"A2|Alltag|Wort|Sicherheit|safety||",
"A2|Alltag|Wort|Spaß|fun||",
"A2|Alltag|Wort|Stimmung|mood||",
"A2|Alltag|Wort|Streit|argument||",
"A2|Alltag|Wort|Teil|part||",
"A2|Alltag|Wort|Teilnehmer|participant||",
"A2|Alltag|Wort|Teilnehmerin|female participant||",
"A2|Alltag|Wort|Unterschied|difference||",
"A2|Alltag|Wort|Unterricht|lesson||",
"A2|Alltag|Wort|Verbindung|connection||",
"A2|Alltag|Wort|Vergangenheit|past||",
"A2|Alltag|Wort|Verhalten|behavior||",
"A2|Alltag|Wort|Verhältnis|relationship||",
"A2|Alltag|Wort|Verlust|loss||",
"A2|Alltag|Wort|Versuch|attempt||",
"A2|Alltag|Wort|Vorteil|advantage||",
"A2|Alltag|Wort|Vorbereitung|preparation||",
"A2|Alltag|Wort|Vorschlag|suggestion||",
"A2|Alltag|Wort|Wahl|choice||",
"A2|Alltag|Wort|Wahrheit|truth||",
"A2|Alltag|Wort|Wunsch|wish||",
"A2|Alltag|Wort|Zukunft|future||",

"A2|Kommunikation|Verb|abgeben|to hand in, give away||",
"A2|Kommunikation|Verb|abnehmen|to lose weight, take off||",
"A2|Kommunikation|Verb|abschließen|to complete, lock||",
"A2|Kommunikation|Verb|achten|to pay attention||",
"A2|Kommunikation|Verb|ändern|to change||",
"A2|Kommunikation|Verb|anprobieren|to try on||",
"A2|Kommunikation|Verb|aufbauen|to build up||",
"A2|Kommunikation|Verb|aufstehen|to get up||",
"A2|Kommunikation|Verb|aufwachen|to wake up||",
"A2|Kommunikation|Verb|ausruhen|to rest||",
"A2|Kommunikation|Verb|beachten|to observe||",
"A2|Kommunikation|Verb|bedanken|to thank||",
"A2|Kommunikation|Verb|begegnen|to meet||",
"A2|Kommunikation|Verb|behalten|to keep||",
"A2|Kommunikation|Verb|beobachten|to observe||",
"A2|Kommunikation|Verb|beraten|to advise||",
"A2|Kommunikation|Verb|berichten|to report||",
"A2|Kommunikation|Verb|beschäftigen|to occupy, employ||",
"A2|Kommunikation|Verb|bestätigen|to confirm||",
"A2|Kommunikation|Verb|betonen|to emphasize||",
"A2|Kommunikation|Verb|bewundern|to admire||",
"A2|Kommunikation|Verb|danken|to thank||",
"A2|Kommunikation|Verb|diskutieren|to discuss||",
"A2|Kommunikation|Verb|drohen|to threaten||",
"A2|Kommunikation|Verb|empfehlen|to recommend||",
"A2|Kommunikation|Verb|entdecken|to discover||",
"A2|Kommunikation|Verb|entschuldigen|to apologize||",
"A2|Kommunikation|Verb|entwickeln|to develop||",
"A2|Kommunikation|Verb|erleben|to experience||",
"A2|Kommunikation|Verb|eröffnen|to open||",
"A2|Kommunikation|Verb|ersetzen|to replace||",
"A2|Kommunikation|Verb|erwarten|to expect||",
"A2|Kommunikation|Verb|feiern|to celebrate||",
"A2|Kommunikation|Verb|folgen|to follow||",
"A2|Kommunikation|Verb|funktionieren|to function||",
"A2|Kommunikation|Verb|gehören|to belong||",
"A2|Kommunikation|Verb|glauben|to believe||",
"A2|Kommunikation|Verb|hoffen|to hope||",
"A2|Kommunikation|Verb|hören|to hear||",
"A2|Kommunikation|Verb|ignorieren|to ignore||",
"A2|Kommunikation|Verb|kontrollieren|to control||",
"A2|Kommunikation|Verb|lösen|to solve||",
"A2|Kommunikation|Verb|meinen|to mean, think||",
"A2|Kommunikation|Verb|mitbringen|to bring along||",
"A2|Kommunikation|Verb|mitmachen|to participate||",
"A2|Kommunikation|Verb|nachfragen|to ask again||",
"A2|Kommunikation|Verb|organisieren|to organize||",
"A2|Kommunikation|Verb|passieren|to happen||",
"A2|Kommunikation|Verb|prüfen|to check||",
"A2|Kommunikation|Verb|reagieren|to react||",
"A2|Kommunikation|Verb|rechnen|to calculate||",
"A2|Kommunikation|Verb|riechen|to smell||",
"A2|Kommunikation|Verb|rufen|to call||",
"A2|Kommunikation|Verb|schmecken|to taste||",
"A2|Kommunikation|Verb|schneiden|to cut||",
"A2|Kommunikation|Verb|schützen|to protect||",
"A2|Kommunikation|Verb|stören|to disturb||",
"A2|Kommunikation|Verb|teilen|to share||",
"A2|Kommunikation|Verb|übernachten|to stay overnight||",
"A2|Kommunikation|Verb|übersetzen|to translate||",
"A2|Kommunikation|Verb|überweisen|to transfer||",
"A2|Kommunikation|Verb|untersuchen|to examine||",
"A2|Kommunikation|Verb|verändern|to change||",
"A2|Kommunikation|Verb|verbessern|to improve||",
"A2|Kommunikation|Verb|verbrauchen|to consume||",
"A2|Kommunikation|Verb|verbringen|to spend||",
"A2|Kommunikation|Verb|vermissen|to miss||",
"A2|Kommunikation|Verb|versprechen|to promise||",
"A2|Kommunikation|Verb|vorbereiten|to prepare||",
"A2|Kommunikation|Verb|vorlesen|to read aloud||",
"A2|Kommunikation|Verb|vorschlagen|to suggest||",
"A2|Kommunikation|Verb|warnen|to warn||",
"A2|Kommunikation|Verb|wählen|to choose||",
"A2|Kommunikation|Verb|wiedersehen|to see again||",
"A2|Kommunikation|Verb|wünschen|to wish||",
"A2|Kommunikation|Verb|zahlen|to pay||",
"A2|Kommunikation|Verb|zählen|to count||",
"A2|Kommunikation|Verb|zerstören|to destroy||",

"A2|Adjektive|Adjektiv|ähnlich|similar||",
"A2|Adjektive|Adjektiv|allgemein|general||",
"A2|Adjektive|Adjektiv|alleinstehend|single||",
"A2|Adjektive|Adjektiv|anstrengend|tiring||",
"A2|Adjektive|Adjektiv|arm|poor||",
"A2|Adjektive|Adjektiv|auffällig|noticeable||",
"A2|Adjektive|Adjektiv|ausgezeichnet|excellent||",
"A2|Adjektive|Adjektiv|automatisch|automatic||",
"A2|Adjektive|Adjektiv|bereit|ready||",
"A2|Adjektive|Adjektiv|besetzt|occupied||",
"A2|Adjektive|Adjektiv|bestimmt|certain, specific||",
"A2|Adjektive|Adjektiv|bewusst|conscious||",
"A2|Adjektive|Adjektiv|böse|angry, bad||",
"A2|Adjektive|Adjektiv|breit|wide||",
"A2|Adjektive|Adjektiv|draußen|outside||",
"A2|Adjektive|Adjektiv|dringend|urgent||",
"A2|Adjektive|Adjektiv|eigen|own||",
"A2|Adjektive|Adjektiv|ernst|serious||",
"A2|Adjektive|Adjektiv|erfolgreich|successful||",
"A2|Adjektive|Adjektiv|fleißig|hard-working||",
"A2|Adjektive|Adjektiv|gefährlich|dangerous||",
"A2|Adjektive|Adjektiv|geduldig|patient||",
"A2|Adjektive|Adjektiv|gemeinsam|shared, together||",
"A2|Adjektive|Adjektiv|gemütlich|comfortable, cozy||",
"A2|Adjektive|Adjektiv|genervt|annoyed||",
"A2|Adjektive|Adjektiv|gewöhnlich|usual||",
"A2|Adjektive|Adjektiv|höflich|polite||",
"A2|Adjektive|Adjektiv|hungrig|hungry||",
"A2|Adjektive|Adjektiv|kaputt|broken||",
"A2|Adjektive|Adjektiv|klar|clear||",
"A2|Adjektive|Adjektiv|komplett|complete||",
"A2|Adjektive|Adjektiv|kostenlos|free of charge||",
"A2|Adjektive|Adjektiv|leer|empty||",
"A2|Adjektive|Adjektiv|lustig|funny||",
"A2|Adjektive|Adjektiv|möglich|possible||",
"A2|Adjektive|Adjektiv|müde|tired||",
"A2|Adjektive|Adjektiv|nervös|nervous||",
"A2|Adjektive|Adjektiv|notwendig|necessary||",
"A2|Adjektive|Adjektiv|offen|open||",
"A2|Adjektive|Adjektiv|privat|private||",
"A2|Adjektive|Adjektiv|pünktlich|punctual||",
"A2|Adjektive|Adjektiv|reich|rich||",
"A2|Adjektive|Adjektiv|sauber|clean||",
"A2|Adjektive|Adjektiv|schmutzig|dirty||",
"A2|Adjektive|Adjektiv|selbstständig|independent||",
"A2|Adjektive|Adjektiv|sicher|safe, certain||",
"A2|Adjektive|Adjektiv|stolz|proud||",
"A2|Adjektive|Adjektiv|streng|strict||",
"A2|Adjektive|Adjektiv|typisch|typical||",
"A2|Adjektive|Adjektiv|verheiratet|married||",
"A2|Adjektive|Adjektiv|verletzt|injured||",
"A2|Adjektive|Adjektiv|voll|full||",
"A2|Adjektive|Adjektiv|wahrscheinlich|probably, likely||",
"A2|Adjektive|Adjektiv|zufrieden|satisfied||",

"A2|Wohnen|Nomen|Wohnzimmer|living room||",
"A2|Wohnen|Nomen|Schlafzimmer|bedroom||",
"A2|Wohnen|Nomen|Badezimmer|bathroom||",
"A2|Wohnen|Nomen|Keller|basement||",
"A2|Wohnen|Nomen|Dach|roof||",
"A2|Wohnen|Nomen|Miete|rent||",
"A2|Wohnen|Nomen|Vermieter|landlord||",
"A2|Wohnen|Nomen|Vermieterin|landlady||",
"A2|Wohnen|Nomen|Mieter|tenant||",
"A2|Wohnen|Nomen|Mieterin|female tenant||",
"A2|Wohnen|Nomen|Nachbarschaft|neighborhood||",
"A2|Wohnen|Nomen|Wohnort|place of residence||",
"A2|Wohnen|Nomen|Umzug|move||",
"A2|Wohnen|Nomen|Möbel|furniture||",
"A2|Wohnen|Nomen|Schreibtisch|desk||",
"A2|Wohnen|Nomen|Stuhl|chair||",
"A2|Wohnen|Nomen|Sessel|armchair||",
"A2|Wohnen|Nomen|Regal|shelf||",
"A2|Wohnen|Nomen|Teppich|carpet||",
"A2|Wohnen|Nomen|Vorhang|curtain||",
"A2|Wohnen|Nomen|Wand|wall||",
"A2|Wohnen|Nomen|Decke|ceiling, blanket||",
"A2|Wohnen|Nomen|Steckdose|socket||",
"A2|Wohnen|Nomen|Waschmaschine|washing machine||",
"A2|Wohnen|Nomen|Kühlschrank|fridge||",
"A2|Wohnen|Nomen|Herd|stove||",
"A2|Wohnen|Nomen|Spülmaschine|dishwasher||",
"A2|Wohnen|Nomen|Müll|rubbish||",
"A2|Wohnen|Nomen|Mülltonne|bin||",
"A2|Wohnen|Nomen|Heizung|heating||",
"A2|Wohnen|Nomen|Strom|electricity||",
"A2|Wohnen|Nomen|Wasserhahn|tap||",

"A2|Arbeit|Nomen|Bewerbung|application||",
"A2|Arbeit|Nomen|Lebenslauf|CV, résumé||",
"A2|Arbeit|Nomen|Vorstellungsgespräch|job interview||",
"A2|Arbeit|Nomen|Ausbildung|vocational training||",
"A2|Arbeit|Nomen|Arbeitsplatz|workplace||",
"A2|Arbeit|Nomen|Arbeitszeit|working hours||",
"A2|Arbeit|Nomen|Kollege|colleague||",
"A2|Arbeit|Nomen|Kollegin|female colleague||",
"A2|Arbeit|Nomen|Chef|boss||",
"A2|Arbeit|Nomen|Chefin|female boss||",
"A2|Arbeit|Nomen|Firma|company||",
"A2|Arbeit|Nomen|Büro|office||",
"A2|Arbeit|Nomen|Besprechung|meeting||",
"A2|Arbeit|Nomen|Termin|appointment||",
"A2|Arbeit|Nomen|Vertrag|contract||",
"A2|Arbeit|Nomen|Gehalt|salary||",
"A2|Arbeit|Nomen|Lohn|wage||",
"A2|Arbeit|Nomen|Urlaubstag|vacation day||",
"A2|Arbeit|Nomen|Schicht|shift||",
"A2|Arbeit|Nomen|Erfahrung|experience||",
"A2|Arbeit|Nomen|Kenntnis|knowledge||",
"A2|Arbeit|Nomen|Fähigkeit|ability||",
"A2|Arbeit|Nomen|Berufserfahrung|work experience||",
"A2|Arbeit|Nomen|Karriere|career||",
"A2|Arbeit|Nomen|Abteilung|department||",
"A2|Arbeit|Nomen|Leitung|management||",
"A2|Arbeit|Nomen|Kunde|customer||",
"A2|Arbeit|Nomen|Kundin|female customer||",
"A2|Arbeit|Nomen|Angebot|offer||",
"A2|Arbeit|Nomen|Rechnung|invoice||",
"A2|Arbeit|Nomen|Lösung|solution||",
"A2|Arbeit|Nomen|Projekt|project||",
"A2|Arbeit|Nomen|Plan|plan||",
"A2|Arbeit|Nomen|Ziel|goal||",
"A2|Arbeit|Nomen|Erfolg|success||",
"A2|Arbeit|Nomen|Feierabend|end of working day||",
"A2|Arbeit|Nomen|Arbeitsvertrag|employment contract||",

"A2|Reisen|Nomen|Unterkunft|accommodation||",
"A2|Reisen|Nomen|Rezeption|reception||",
"A2|Reisen|Nomen|Reservierung|reservation||",
"A2|Reisen|Nomen|Reisepass|passport||",
"A2|Reisen|Nomen|Koffer|suitcase||",
"A2|Reisen|Nomen|Reisetasche|travel bag||",
"A2|Reisen|Nomen|Flug|flight||",
"A2|Reisen|Nomen|Abflug|departure||",
"A2|Reisen|Nomen|Ankunft|arrival||",
"A2|Reisen|Nomen|Anschluss|connection||",
"A2|Reisen|Nomen|Verspätung|delay||",
"A2|Reisen|Nomen|Fahrplan|timetable||",
"A2|Reisen|Nomen|Bahnhofshalle|station hall||",
"A2|Reisen|Nomen|Fahrgast|passenger||",
"A2|Reisen|Nomen|Reiseziel|destination||",
"A2|Reisen|Nomen|Ausland|abroad||",
"A2|Reisen|Nomen|Grenze|border||",
"A2|Reisen|Nomen|Küste|coast||",
"A2|Reisen|Nomen|Insel|island||",
"A2|Reisen|Nomen|Strand|beach||",
"A2|Reisen|Nomen|Bergtour|mountain tour||",
"A2|Reisen|Nomen|Reiseführer|guidebook||",
"A2|Reisen|Nomen|Sehenswürdigkeit|sight, attraction||",
"A2|Reisen|Nomen|Museum|museum||",
"A2|Reisen|Nomen|Eintritt|admission||",
"A2|Reisen|Nomen|Reisebüro|travel agency||",
"A2|Reisen|Nomen|Fremdenführer|tour guide||",
"A2|Reisen|Nomen|Tourist|tourist||",
"A2|Reisen|Nomen|Touristin|female tourist||",

"A2|Gesundheit|Nomen|Gesundheit|health||",
"A2|Gesundheit|Nomen|Krankheit|illness||",
"A2|Gesundheit|Nomen|Erkältung|cold||",
"A2|Gesundheit|Nomen|Fieber|fever||",
"A2|Gesundheit|Nomen|Schmerz|pain||",
"A2|Gesundheit|Nomen|Kopfschmerz|headache||",
"A2|Gesundheit|Nomen|Bauchschmerz|stomachache||",
"A2|Gesundheit|Nomen|Husten|cough||",
"A2|Gesundheit|Nomen|Schnupfen|runny nose||",
"A2|Gesundheit|Nomen|Medizin|medicine||",
"A2|Gesundheit|Nomen|Tablette|tablet||",
"A2|Gesundheit|Nomen|Rezept|prescription||",
"A2|Gesundheit|Nomen|Krankenhaus|hospital||",
"A2|Gesundheit|Nomen|Krankenversicherung|health insurance||",
"A2|Gesundheit|Nomen|Untersuchung|examination||",
"A2|Gesundheit|Nomen|Patient|patient||",
"A2|Gesundheit|Nomen|Patientin|female patient||",
"A2|Gesundheit|Nomen|Zahnarzt|dentist||",
"A2|Gesundheit|Nomen|Zahnärztin|female dentist||",
"A2|Gesundheit|Nomen|Notfall|emergency||",
"A2|Gesundheit|Nomen|Gesundheitsamt|health authority||",
"A2|Gesundheit|Nomen|Körper|body||",
"A2|Gesundheit|Nomen|Haut|skin||",
"A2|Gesundheit|Nomen|Herz|heart||",
"A2|Gesundheit|Nomen|Magen|stomach||",
"A2|Gesundheit|Nomen|Hals|throat, neck||",
"A2|Gesundheit|Nomen|Arm|arm||",
"A2|Gesundheit|Nomen|Bein|leg||",
"A2|Gesundheit|Nomen|Finger|finger||",
"A2|Gesundheit|Nomen|Knie|knee||",

"A2|Essen|Nomen|Mahlzeit|meal||",
"A2|Essen|Nomen|Speise|dish||",
"A2|Essen|Nomen|Zutat|ingredient||",
"A2|Essen|Nomen|Rezept|recipe||",
"A2|Essen|Nomen|Salz|salt||",
"A2|Essen|Nomen|Pfeffer|pepper||",
"A2|Essen|Nomen|Öl|oil||",
"A2|Essen|Nomen|Mehl|flour||",
"A2|Essen|Nomen|Reis|rice||",
"A2|Essen|Nomen|Nudel|noodle||",
"A2|Essen|Nomen|Kartoffel|potato||",
"A2|Essen|Nomen|Tomate|tomato||",
"A2|Essen|Nomen|Zwiebel|onion||",
"A2|Essen|Nomen|Karotte|carrot||",
"A2|Essen|Nomen|Gurke|cucumber||",
"A2|Essen|Nomen|Salat|salad||",
"A2|Essen|Nomen|Suppe|soup||",
"A2|Essen|Nomen|Soße|sauce||",
"A2|Essen|Nomen|Hähnchen|chicken||",
"A2|Essen|Nomen|Wurst|sausage||",
"A2|Essen|Nomen|Schinken|ham||",
"A2|Essen|Nomen|Obst|fruit||",
"A2|Essen|Nomen|Birne|pear||",
"A2|Essen|Nomen|Orange|orange||",
"A2|Essen|Nomen|Zitrone|lemon||",
"A2|Essen|Nomen|Traube|grape||",
"A2|Essen|Nomen|Kirsche|cherry||",
"A2|Essen|Nomen|Ananas|pineapple||",
"A2|Essen|Nomen|Schokolade|chocolate||",
"A2|Essen|Nomen|Honig|honey||",
"A2|Essen|Nomen|Marmelade|jam||",
"A2|Essen|Nomen|Joghurt|yogurt||",

"A2|Einkaufen|Nomen|Einkauf|shopping||",
"A2|Einkaufen|Nomen|Kasse|checkout||",
"A2|Einkaufen|Nomen|Verkäufer|salesperson||",
"A2|Einkaufen|Nomen|Verkäuferin|female salesperson||",
"A2|Einkaufen|Nomen|Größe|size||",
"A2|Einkaufen|Nomen|Marke|brand||",
"A2|Einkaufen|Nomen|Rabatt|discount||",
"A2|Einkaufen|Nomen|Sonderangebot|special offer||",
"A2|Einkaufen|Nomen|Quittung|receipt||",
"A2|Einkaufen|Nomen|Geldbörse|wallet||",
"A2|Einkaufen|Nomen|Portemonnaie|wallet||",
"A2|Einkaufen|Nomen|Münze|coin||",
"A2|Einkaufen|Nomen|Schein|banknote||",
"A2|Einkaufen|Nomen|Kreditkarte|credit card||",
"A2|Einkaufen|Nomen|Einkaufswagen|shopping cart||",
"A2|Einkaufen|Nomen|Tüte|bag||",
"A2|Einkaufen|Nomen|Produkt|product||",
"A2|Einkaufen|Nomen|Qualität|quality||",
"A2|Einkaufen|Nomen|Garantie|guarantee||",
"A2|Einkaufen|Nomen|Umtausch|exchange||",
"A2|Einkaufen|Nomen|Kauf|purchase||",
"A2|Einkaufen|Nomen|Verkauf|sale||",
"A2|Einkaufen|Nomen|Lieferung|delivery||",
"A2|Einkaufen|Nomen|Bestellung|order||",

"A2|Verkehr|Nomen|Verkehrsmittel|means of transport||",
"A2|Verkehr|Nomen|Straßenbahn|tram||",
"A2|Verkehr|Nomen|U-Bahn|subway||",
"A2|Verkehr|Nomen|S-Bahn|urban train||",
"A2|Verkehr|Nomen|Fahrzeug|vehicle||",
"A2|Verkehr|Nomen|Fahrer|driver||",
"A2|Verkehr|Nomen|Fahrerin|female driver||",
"A2|Verkehr|Nomen|Führerschein|driving licence||",
"A2|Verkehr|Nomen|Ampel|traffic light||",
"A2|Verkehr|Nomen|Kreuzung|intersection||",
"A2|Verkehr|Nomen|Ecke|corner||",
"A2|Verkehr|Nomen|Brücke|bridge||",
"A2|Verkehr|Nomen|Tunnel|tunnel||",
"A2|Verkehr|Nomen|Autobahn|motorway||",
"A2|Verkehr|Nomen|Tankstelle|petrol station||",
"A2|Verkehr|Nomen|Benzin|petrol||",
"A2|Verkehr|Nomen|Stau|traffic jam||",
"A2|Verkehr|Nomen|Unfall|accident||",
"A2|Verkehr|Nomen|Parkplatz|parking space||",
"A2|Verkehr|Nomen|Geschwindigkeit|speed||",
"A2|Verkehr|Nomen|Richtung|direction||",
"A2|Verkehr|Nomen|Norden|north||",
"A2|Verkehr|Nomen|Süden|south||",
"A2|Verkehr|Nomen|Osten|east||",
"A2|Verkehr|Nomen|Westen|west||",
"A2|Verkehr|Nomen|Kreisverkehr|roundabout||",

"A2|Kommunikation|Verb|anbieten|to offer||",
"A2|Kommunikation|Verb|anmelden|to register||",
"A2|Kommunikation|Verb|anziehen|to put on||",
"A2|Kommunikation|Verb|aufhören|to stop||",
"A2|Kommunikation|Verb|aufmachen|to open||",
"A2|Kommunikation|Verb|aufpassen|to pay attention||",
"A2|Kommunikation|Verb|ausfüllen|to fill out||",
"A2|Kommunikation|Verb|ausgeben|to spend||",
"A2|Kommunikation|Verb|ausmachen|to turn off, arrange||",
"A2|Kommunikation|Verb|auspacken|to unpack||",
"A2|Kommunikation|Verb|beginnen|to begin||",
"A2|Kommunikation|Verb|bestellen|to order||",
"A2|Kommunikation|Verb|besprechen|to discuss||",
"A2|Kommunikation|Verb|besuchen|to visit||",
"A2|Kommunikation|Verb|beantworten|to answer||",
"A2|Kommunikation|Verb|beschreiben|to describe||",
"A2|Kommunikation|Verb|einpacken|to pack||",
"A2|Kommunikation|Verb|einschalten|to switch on||",
"A2|Kommunikation|Verb|entscheiden|to decide||",
"A2|Kommunikation|Verb|erklären|to explain||",
"A2|Kommunikation|Verb|erlauben|to allow||",
"A2|Kommunikation|Verb|erreichen|to reach||",
"A2|Kommunikation|Verb|erkennen|to recognize||",
"A2|Kommunikation|Verb|gewinnen|to win||",
"A2|Kommunikation|Verb|gratulieren|to congratulate||",
"A2|Kommunikation|Verb|gründen|to found||",
"A2|Kommunikation|Verb|informieren|to inform||",
"A2|Kommunikation|Verb|kennen|to know, be familiar with||",
"A2|Kommunikation|Verb|klappen|to work out||",
"A2|Kommunikation|Verb|kündigen|to resign, cancel||",
"A2|Kommunikation|Verb|mieten|to rent||",
"A2|Kommunikation|Verb|planen|to plan||",
"A2|Kommunikation|Verb|probieren|to try||",
"A2|Kommunikation|Verb|reparieren|to repair||",
"A2|Kommunikation|Verb|reservieren|to reserve||",
"A2|Kommunikation|Verb|schaffen|to manage, create||",
"A2|Kommunikation|Verb|schicken|to send||",
"A2|Kommunikation|Verb|schließen|to close||",
"A2|Kommunikation|Verb|sparen|to save||",
"A2|Kommunikation|Verb|starten|to start||",
"A2|Kommunikation|Verb|stattfinden|to take place||",
"A2|Kommunikation|Verb|teilnehmen|to participate||",
"A2|Kommunikation|Verb|umsteigen|to change trains||",
"A2|Kommunikation|Verb|unterschreiben|to sign||",
"A2|Kommunikation|Verb|verdienen|to earn||",
"A2|Kommunikation|Verb|vergleichen|to compare||",
"A2|Kommunikation|Verb|vermeiden|to avoid||",
"A2|Kommunikation|Verb|vorbereiten|to prepare||",
"A2|Kommunikation|Verb|vorstellen|to introduce, imagine||",
"A2|Kommunikation|Verb|wechseln|to change||",
"A2|Kommunikation|Verb|wiederholen|to repeat||",
"A2|Kommunikation|Verb|zurückkommen|to come back||",

"B1|Gesellschaft|Nomen|Abhängigkeit|dependence||",
"B1|Gesellschaft|Nomen|Abteilung|department||",
"B1|Gesellschaft|Nomen|Akte|file||",
"B1|Gesellschaft|Nomen|Anforderung|requirement||",
"B1|Gesellschaft|Nomen|Anteil|share||",
"B1|Gesellschaft|Nomen|Antrag|application||",
"B1|Gesellschaft|Nomen|Arbeitslosigkeit|unemployment||",
"B1|Gesellschaft|Nomen|Aufenthalt|stay||",
"B1|Gesellschaft|Nomen|Aufwand|effort, expense||",
"B1|Gesellschaft|Nomen|Ausbildung|vocational training||",
"B1|Gesellschaft|Nomen|Auswirkung|effect||",
"B1|Gesellschaft|Nomen|Behörde|authority||",
"B1|Gesellschaft|Nomen|Begründung|justification||",
"B1|Gesellschaft|Nomen|Bereich|area||",
"B1|Gesellschaft|Nomen|Beratung|consultation||",
"B1|Gesellschaft|Nomen|Bericht|report||",
"B1|Gesellschaft|Nomen|Beschäftigung|employment||",
"B1|Gesellschaft|Nomen|Besitz|possession||",
"B1|Gesellschaft|Nomen|Bevölkerung|population||",
"B1|Gesellschaft|Nomen|Bildung|education||",
"B1|Gesellschaft|Nomen|Bürger|citizen||",
"B1|Gesellschaft|Nomen|Bürgerin|female citizen||",
"B1|Gesellschaft|Nomen|Debatte|debate||",
"B1|Gesellschaft|Nomen|Demokratie|democracy||",
"B1|Gesellschaft|Nomen|Einfluss|influence||",
"B1|Gesellschaft|Nomen|Einrichtung|facility||",
"B1|Gesellschaft|Nomen|Entwicklung|development||",
"B1|Gesellschaft|Nomen|Ereignis|event||",
"B1|Gesellschaft|Nomen|Erwartung|expectation||",
"B1|Gesellschaft|Nomen|Forschung|research||",
"B1|Gesellschaft|Nomen|Freiheit|freedom||",
"B1|Gesellschaft|Nomen|Führung|leadership||",
"B1|Gesellschaft|Nomen|Gesellschaft|society||",
"B1|Gesellschaft|Nomen|Gesetz|law||",
"B1|Gesellschaft|Nomen|Gespräch|conversation||",
"B1|Gesellschaft|Nomen|Gewalt|violence||",
"B1|Gesellschaft|Nomen|Gewinn|profit, gain||",
"B1|Gesellschaft|Nomen|Gleichheit|equality||",
"B1|Gesellschaft|Nomen|Grundlage|basis||",
"B1|Gesellschaft|Nomen|Haltung|attitude||",
"B1|Gesellschaft|Nomen|Herausforderung|challenge||",
"B1|Gesellschaft|Nomen|Herkunft|origin||",
"B1|Gesellschaft|Nomen|Identität|identity||",
"B1|Gesellschaft|Nomen|Industrie|industry||",
"B1|Gesellschaft|Nomen|Integration|integration||",
"B1|Gesellschaft|Nomen|Konflikt|conflict||",
"B1|Gesellschaft|Nomen|Kritik|criticism||",
"B1|Gesellschaft|Nomen|Kultur|culture||",
"B1|Gesellschaft|Nomen|Leistung|performance, achievement||",
"B1|Gesellschaft|Nomen|Meinung|opinion||",
"B1|Gesellschaft|Nomen|Minderheit|minority||",
"B1|Gesellschaft|Nomen|Nachbarschaft|neighborhood||",
"B1|Gesellschaft|Nomen|Organisation|organization||",
"B1|Gesellschaft|Nomen|Perspektive|perspective||",
"B1|Gesellschaft|Nomen|Politik|politics||",
"B1|Gesellschaft|Nomen|Recht|law, right||",
"B1|Gesellschaft|Nomen|Regierung|government||",
"B1|Gesellschaft|Nomen|Reihe|row, series||",
"B1|Gesellschaft|Nomen|Rolle|role||",
"B1|Gesellschaft|Nomen|Schutz|protection||",
"B1|Gesellschaft|Nomen|Situation|situation||",
"B1|Gesellschaft|Nomen|Standpunkt|point of view||",
"B1|Gesellschaft|Nomen|Stellung|position||",
"B1|Gesellschaft|Nomen|Struktur|structure||",
"B1|Gesellschaft|Nomen|Thema|topic||",
"B1|Gesellschaft|Nomen|Tradition|tradition||",
"B1|Gesellschaft|Nomen|Umgebung|surroundings||",
"B1|Gesellschaft|Nomen|Umwelt|environment||",
"B1|Gesellschaft|Nomen|Unternehmen|company, enterprise||",
"B1|Gesellschaft|Nomen|Verantwortung|responsibility||",
"B1|Gesellschaft|Nomen|Veränderung|change||",
"B1|Gesellschaft|Nomen|Verständnis|understanding||",
"B1|Gesellschaft|Nomen|Vertrauen|trust||",
"B1|Gesellschaft|Nomen|Voraussetzung|prerequisite||",
"B1|Gesellschaft|Nomen|Wirkung|effect||",
"B1|Gesellschaft|Nomen|Wissenschaft|science||",
"B1|Gesellschaft|Nomen|Zusammenhang|connection, context||",
"B1|Gesellschaft|Nomen|Zusammenarbeit|cooperation||",
"B1|Gesellschaft|Nomen|Zweck|purpose||",

"B1|Arbeit|Nomen|Arbeitskraft|workforce||",
"B1|Arbeit|Nomen|Arbeitsmarkt|job market||",
"B1|Arbeit|Nomen|Arbeitsplatz|workplace||",
"B1|Arbeit|Nomen|Arbeitsloser|unemployed person||",
"B1|Arbeit|Nomen|Berufsleben|working life||",
"B1|Arbeit|Nomen|Berufserfahrung|work experience||",
"B1|Arbeit|Nomen|Betrieb|company, operation||",
"B1|Arbeit|Nomen|Bürokratie|bureaucracy||",
"B1|Arbeit|Nomen|Chefetage|executive floor||",
"B1|Arbeit|Nomen|Einkommen|income||",
"B1|Arbeit|Nomen|Entlassung|dismissal||",
"B1|Arbeit|Nomen|Fachkraft|skilled worker||",
"B1|Arbeit|Nomen|Fähigkeit|ability||",
"B1|Arbeit|Nomen|Gehalt|salary||",
"B1|Arbeit|Nomen|Konkurrenz|competition||",
"B1|Arbeit|Nomen|Kündigung|termination||",
"B1|Arbeit|Nomen|Mitarbeiter|employee||",
"B1|Arbeit|Nomen|Mitarbeiterin|female employee||",
"B1|Arbeit|Nomen|Personal|staff||",
"B1|Arbeit|Nomen|Qualifikation|qualification||",
"B1|Arbeit|Nomen|Stelle|position, job||",
"B1|Arbeit|Nomen|Stellenausschreibung|job advertisement||",
"B1|Arbeit|Nomen|Team|team||",
"B1|Arbeit|Nomen|Tätigkeit|activity, occupation||",
"B1|Arbeit|Nomen|Verantwortung|responsibility||",
"B1|Arbeit|Nomen|Verhandlung|negotiation||",
"B1|Arbeit|Nomen|Vertrag|contract||",
"B1|Arbeit|Nomen|Vorgesetzter|supervisor||",
"B1|Arbeit|Nomen|Weiterbildung|further training||",
"B1|Arbeit|Nomen|Zuverlässigkeit|reliability||",

"B1|Kommunikation|Verb|ablehnen|to reject||",
"B1|Kommunikation|Verb|abschaffen|to abolish||",
"B1|Kommunikation|Verb|abstimmen|to vote, coordinate||",
"B1|Kommunikation|Verb|analysieren|to analyze||",
"B1|Kommunikation|Verb|anerkennen|to recognize||",
"B1|Kommunikation|Verb|ankündigen|to announce||",
"B1|Kommunikation|Verb|annehmen|to accept||",
"B1|Kommunikation|Verb|anpassen|to adapt||",
"B1|Kommunikation|Verb|aufklären|to clarify||",
"B1|Kommunikation|Verb|ausdrücken|to express||",
"B1|Kommunikation|Verb|ausreichen|to be sufficient||",
"B1|Kommunikation|Verb|auswählen|to select||",
"B1|Kommunikation|Verb|beantragen|to apply for||",
"B1|Kommunikation|Verb|beeinflussen|to influence||",
"B1|Kommunikation|Verb|begründen|to justify||",
"B1|Kommunikation|Verb|behandeln|to treat||",
"B1|Kommunikation|Verb|behaupten|to claim||",
"B1|Kommunikation|Verb|berücksichtigen|to consider||",
"B1|Kommunikation|Verb|beruhigen|to calm||",
"B1|Kommunikation|Verb|bestehen|to exist, pass||",
"B1|Kommunikation|Verb|bestimmen|to determine||",
"B1|Kommunikation|Verb|betreffen|to concern||",
"B1|Kommunikation|Verb|beurteilen|to assess||",
"B1|Kommunikation|Verb|bewerten|to evaluate||",
"B1|Kommunikation|Verb|beweisen|to prove||",
"B1|Kommunikation|Verb|darstellen|to represent||",
"B1|Kommunikation|Verb|durchführen|to carry out||",
"B1|Kommunikation|Verb|einführen|to introduce||",
"B1|Kommunikation|Verb|einsetzen|to use, deploy||",
"B1|Kommunikation|Verb|enthalten|to contain||",
"B1|Kommunikation|Verb|entstehen|to arise||",
"B1|Kommunikation|Verb|erfahren|to learn, experience||",
"B1|Kommunikation|Verb|erfordern|to require||",
"B1|Kommunikation|Verb|erweitern|to expand||",
"B1|Kommunikation|Verb|fördern|to promote||",
"B1|Kommunikation|Verb|fordern|to demand||",
"B1|Kommunikation|Verb|gründen|to found||",
"B1|Kommunikation|Verb|handeln|to act, trade||",
"B1|Kommunikation|Verb|hinweisen|to point out||",
"B1|Kommunikation|Verb|investieren|to invest||",
"B1|Kommunikation|Verb|nachweisen|to prove||",
"B1|Kommunikation|Verb|nutzen|to use||",
"B1|Kommunikation|Verb|produzieren|to produce||",
"B1|Kommunikation|Verb|reduzieren|to reduce||",
"B1|Kommunikation|Verb|reflektieren|to reflect||",
"B1|Kommunikation|Verb|realisieren|to realize||",
"B1|Kommunikation|Verb|reagieren|to react||",
"B1|Kommunikation|Verb|schätzen|to estimate, appreciate||",
"B1|Kommunikation|Verb|scheitern|to fail||",
"B1|Kommunikation|Verb|steigern|to increase||",
"B1|Kommunikation|Verb|stärken|to strengthen||",
"B1|Kommunikation|Verb|übernehmen|to take over||",
"B1|Kommunikation|Verb|überzeugen|to convince||",
"B1|Kommunikation|Verb|umsetzen|to implement||",
"B1|Kommunikation|Verb|unterscheiden|to distinguish||",
"B1|Kommunikation|Verb|verhindern|to prevent||",
"B1|Kommunikation|Verb|veröffentlichen|to publish||",
"B1|Kommunikation|Verb|verursachen|to cause||",
"B1|Kommunikation|Verb|wahrnehmen|to perceive||",
"B1|Kommunikation|Verb|widersprechen|to contradict||",
"B1|Kommunikation|Verb|zusagen|to agree, promise||",
"B1|Kommunikation|Verb|zusammenfassen|to summarize||",
"B1|Kommunikation|Verb|zustimmen|to agree||",

"B1|Adjektive|Adjektiv|abhängig|dependent||",
"B1|Adjektive|Adjektiv|angemessen|appropriate||",
"B1|Adjektive|Adjektiv|angeblich|alleged||",
"B1|Adjektive|Adjektiv|anwesend|present||",
"B1|Adjektive|Adjektiv|auffällig|noticeable||",
"B1|Adjektive|Adjektiv|ausreichend|sufficient||",
"B1|Adjektive|Adjektiv|begeistert|enthusiastic||",
"B1|Adjektive|Adjektiv|bekannt|known||",
"B1|Adjektive|Adjektiv|beruflich|professional||",
"B1|Adjektive|Adjektiv|bewusst|aware||",
"B1|Adjektive|Adjektiv|deutlich|clear||",
"B1|Adjektive|Adjektiv|dringend|urgent||",
"B1|Adjektive|Adjektiv|eigenständig|independent||",
"B1|Adjektive|Adjektiv|einheitlich|uniform||",
"B1|Adjektive|Adjektiv|einzig|only, unique||",
"B1|Adjektive|Adjektiv|erfolgreich|successful||",
"B1|Adjektive|Adjektiv|erforderlich|required||",
"B1|Adjektive|Adjektiv|erheblich|considerable||",
"B1|Adjektive|Adjektiv|ernst|serious||",
"B1|Adjektive|Adjektiv|flexibel|flexible||",
"B1|Adjektive|Adjektiv|fortschrittlich|progressive||",
"B1|Adjektive|Adjektiv|freiwillig|voluntary||",
"B1|Adjektive|Adjektiv|geeignet|suitable||",
"B1|Adjektive|Adjektiv|gesellschaftlich|social||",
"B1|Adjektive|Adjektiv|gründlich|thorough||",
"B1|Adjektive|Adjektiv|häufig|frequent||",
"B1|Adjektive|Adjektiv|hilfreich|helpful||",
"B1|Adjektive|Adjektiv|kritisch|critical||",
"B1|Adjektive|Adjektiv|langfristig|long-term||",
"B1|Adjektive|Adjektiv|modern|modern||",
"B1|Adjektive|Adjektiv|nachhaltig|sustainable||",
"B1|Adjektive|Adjektiv|notwendig|necessary||",
"B1|Adjektive|Adjektiv|offensichtlich|obvious||",
"B1|Adjektive|Adjektiv|persönlich|personal||",
"B1|Adjektive|Adjektiv|politisch|political||",
"B1|Adjektive|Adjektiv|praktisch|practical||",
"B1|Adjektive|Adjektiv|realistisch|realistic||",
"B1|Adjektive|Adjektiv|relevant|relevant||",
"B1|Adjektive|Adjektiv|selbstbewusst|self-confident||",
"B1|Adjektive|Adjektiv|sozial|social||",
"B1|Adjektive|Adjektiv|staatlich|state, governmental||",
"B1|Adjektive|Adjektiv|ständig|constant||",
"B1|Adjektive|Adjektiv|typisch|typical||",
"B1|Adjektive|Adjektiv|unabhängig|independent||",
"B1|Adjektive|Adjektiv|unterschiedlich|different||",
"B1|Adjektive|Adjektiv|verantwortlich|responsible||",
"B1|Adjektive|Adjektiv|verfügbar|available||",
"B1|Adjektive|Adjektiv|vernünftig|reasonable||",
"B1|Adjektive|Adjektiv|verständlich|understandable||",
"B1|Adjektive|Adjektiv|wirtschaftlich|economic||",
"B1|Adjektive|Adjektiv|zufällig|accidental||",
"B1|Adjektive|Adjektiv|zuverlässig|reliable||",

"B1|Bildung|Nomen|Abschluss|qualification, graduation||",
"B1|Bildung|Nomen|Aufsatz|essay||",
"B1|Bildung|Nomen|Dozent|lecturer||",
"B1|Bildung|Nomen|Dozentin|female lecturer||",
"B1|Bildung|Nomen|Fach|subject||",
"B1|Bildung|Nomen|Fachbereich|department||",
"B1|Bildung|Nomen|Hochschule|university||",
"B1|Bildung|Nomen|Klausur|written exam||",
"B1|Bildung|Nomen|Lehrbuch|textbook||",
"B1|Bildung|Nomen|Lernziel|learning objective||",
"B1|Bildung|Nomen|Methode|method||",
"B1|Bildung|Nomen|Studium|studies||",
"B1|Bildung|Nomen|Stipendium|scholarship||",
"B1|Bildung|Nomen|Universität|university||",
"B1|Bildung|Nomen|Vorlesung|lecture||",
"B1|Bildung|Nomen|Wissen|knowledge||",
"B1|Bildung|Nomen|Zeugnis|certificate, report||",
"B1|Bildung|Nomen|Zertifikat|certificate||",

"B1|Medien|Nomen|Beitrag|contribution, article||",
"B1|Medien|Nomen|Fernsehsendung|TV program||",
"B1|Medien|Nomen|Journalist|journalist||",
"B1|Medien|Nomen|Journalistin|female journalist||",
"B1|Medien|Nomen|Nachrichten|news||",
"B1|Medien|Nomen|Netzwerk|network||",
"B1|Medien|Nomen|Presse|press||",
"B1|Medien|Nomen|Radiosender|radio station||",
"B1|Medien|Nomen|Redaktion|editorial office||",
"B1|Medien|Nomen|Sendung|broadcast||",
"B1|Medien|Nomen|Sender|broadcaster||",
"B1|Medien|Nomen|Serie|series||",
"B1|Medien|Nomen|Soziale Medien|social media||",
"B1|Medien|Nomen|Suchmaschine|search engine||",
"B1|Medien|Nomen|Werbung|advertising||",
"B1|Medien|Nomen|Zeitschrift|magazine||",
"B1|Medien|Nomen|Zuschauer|viewer||",
"B1|Medien|Nomen|Zuschauerin|female viewer||",

"B1|Umwelt|Nomen|Abfall|waste||",
"B1|Umwelt|Nomen|Energie|energy||",
"B1|Umwelt|Nomen|Erde|earth||",
"B1|Umwelt|Nomen|Erwärmung|warming||",
"B1|Umwelt|Nomen|Fläche|area||",
"B1|Umwelt|Nomen|Klima|climate||",
"B1|Umwelt|Nomen|Klimawandel|climate change||",
"B1|Umwelt|Nomen|Landschaft|landscape||",
"B1|Umwelt|Nomen|Müll|waste||",
"B1|Umwelt|Nomen|Natur|nature||",
"B1|Umwelt|Nomen|Recycling|recycling||",
"B1|Umwelt|Nomen|Ressource|resource||",
"B1|Umwelt|Nomen|Treibhausgas|greenhouse gas||",
"B1|Umwelt|Nomen|Umweltschutz|environmental protection||",
"B1|Umwelt|Nomen|Wald|forest||",
"B1|Umwelt|Nomen|Verschmutzung|pollution||",
"B1|Umwelt|Nomen|Verbrauch|consumption||",

"B1|Gefühle|Nomen|Angst|fear||",
"B1|Gefühle|Nomen|Ärger|anger||",
"B1|Gefühle|Nomen|Begeisterung|enthusiasm||",
"B1|Gefühle|Nomen|Enttäuschung|disappointment||",
"B1|Gefühle|Nomen|Freude|joy||",
"B1|Gefühle|Nomen|Geduld|patience||",
"B1|Gefühle|Nomen|Hoffnung|hope||",
"B1|Gefühle|Nomen|Liebe|love||",
"B1|Gefühle|Nomen|Mitleid|compassion||",
"B1|Gefühle|Nomen|Mut|courage||",
"B1|Gefühle|Nomen|Neid|envy||",
"B1|Gefühle|Nomen|Panik|panic||",
"B1|Gefühle|Nomen|Respekt|respect||",
"B1|Gefühle|Nomen|Scham|shame||",
"B1|Gefühle|Nomen|Schuld|guilt||",
"B1|Gefühle|Nomen|Stolz|pride||",
"B1|Gefühle|Nomen|Trauer|grief||",
"B1|Gefühle|Nomen|Wut|anger||",

"B1|Gesundheit|Nomen|Bewegung|exercise||",
"B1|Gesundheit|Nomen|Ernährung|nutrition||",
"B1|Gesundheit|Nomen|Gewicht|weight||",
"B1|Gesundheit|Nomen|Krankenkasse|health insurance fund||",
"B1|Gesundheit|Nomen|Lebensmittel|food||",
"B1|Gesundheit|Nomen|Lebensstil|lifestyle||",
"B1|Gesundheit|Nomen|Mangel|deficiency||",
"B1|Gesundheit|Nomen|Pflege|care||",
"B1|Gesundheit|Nomen|Schlaf|sleep||",
"B1|Gesundheit|Nomen|Stress|stress||",
"B1|Gesundheit|Nomen|Therapie|therapy||",
"B1|Gesundheit|Nomen|Verletzung|injury||",
"B1|Gesundheit|Nomen|Vorsorge|prevention||",
"B1|Gesundheit|Nomen|Übergewicht|overweight||",
"B1|Gesundheit|Nomen|Erholung|recovery||",

"B1|Verben|Verb|abnehmen|to decrease, lose weight||",
"B1|Verben|Verb|anfordern|to request||",
"B1|Verben|Verb|anregen|to stimulate||",
"B1|Verben|Verb|anstreben|to strive for||",
"B1|Verben|Verb|aufgeben|to give up||",
"B1|Verben|Verb|aufnehmen|to record, accept||",
"B1|Verben|Verb|ausnutzen|to exploit, use||",
"B1|Verben|Verb|beeinträchtigen|to impair||",
"B1|Verben|Verb|belasten|to burden||",
"B1|Verben|Verb|berechnen|to calculate||",
"B1|Verben|Verb|beschleunigen|to accelerate||",
"B1|Verben|Verb|beschränken|to restrict||",
"B1|Verben|Verb|betrachten|to consider, look at||",
"B1|Verben|Verb|bewältigen|to cope with||",
"B1|Verben|Verb|durchsetzen|to enforce||",
"B1|Verben|Verb|einschätzen|to assess||",
"B1|Verben|Verb|entlasten|to relieve||",
"B1|Verben|Verb|erhöhen|to increase||",
"B1|Verben|Verb|erlauben|to allow||",
"B1|Verben|Verb|erwähnen|to mention||",
"B1|Verben|Verb|feststellen|to determine||",
"B1|Verben|Verb|gestalten|to design||",
"B1|Verben|Verb|herstellen|to manufacture||",
"B1|Verben|Verb|leisten|to achieve, provide||",
"B1|Verben|Verb|markieren|to mark||",
"B1|Verben|Verb|motivieren|to motivate||",
"B1|Verben|Verb|schaden|to harm||",
"B1|Verben|Verb|senken|to lower||",
"B1|Verben|Verb|stören|to disturb||",
"B1|Verben|Verb|überprüfen|to check||",
"B1|Verben|Verb|unterstützen|to support||",
"B1|Verben|Verb|verarbeiten|to process||",
"B1|Verben|Verb|verfügen|to have at disposal||",
"B1|Verben|Verb|verlangen|to demand||",
"B1|Verben|Verb|verzichten|to give up||",
"B1|Verben|Verb|vorantreiben|to drive forward||",
"B1|Verben|Verb|vorgehen|to proceed||",
"B1|Verben|Verb|vorwerfen|to accuse||",
"B1|Verben|Verb|weiterentwickeln|to develop further||",
"B1|Verben|Verb|wiederholen|to repeat||",
"B1|Verben|Verb|zusammenarbeiten|to cooperate||",

"B2|Gesellschaft|Nomen|Abkommen|agreement||",
"B2|Gesellschaft|Nomen|Absicht|intention||",
"B2|Gesellschaft|Nomen|Akteur|actor||",
"B2|Gesellschaft|Nomen|Angelegenheit|matter||",
"B2|Gesellschaft|Nomen|Annahme|assumption||",
"B2|Gesellschaft|Nomen|Ansatz|approach||",
"B2|Gesellschaft|Nomen|Aufklärung|clarification, enlightenment||",
"B2|Gesellschaft|Nomen|Ausmaß|extent||",
"B2|Gesellschaft|Nomen|Auseinandersetzung|debate, confrontation||",
"B2|Gesellschaft|Nomen|Bedrohung|threat||",
"B2|Gesellschaft|Nomen|Bedingung|condition||",
"B2|Gesellschaft|Nomen|Begabung|talent||",
"B2|Gesellschaft|Nomen|Begründung|reasoning||",
"B2|Gesellschaft|Nomen|Beurteilung|assessment||",
"B2|Gesellschaft|Nomen|Bewusstsein|awareness||",
"B2|Gesellschaft|Nomen|Einigkeit|unity||",
"B2|Gesellschaft|Nomen|Einschätzung|assessment||",
"B2|Gesellschaft|Nomen|Entschlossenheit|determination||",
"B2|Gesellschaft|Nomen|Forderung|demand||",
"B2|Gesellschaft|Nomen|Gerechtigkeit|justice||",
"B2|Gesellschaft|Nomen|Gleichgewicht|balance||",
"B2|Gesellschaft|Nomen|Hintergrund|background||",
"B2|Gesellschaft|Nomen|Interaktion|interaction||",
"B2|Gesellschaft|Nomen|Konsequenz|consequence||",
"B2|Gesellschaft|Nomen|Lebensweise|way of life||",
"B2|Gesellschaft|Nomen|Maßnahme|measure||",
"B2|Gesellschaft|Nomen|Nachweis|evidence||",
"B2|Gesellschaft|Nomen|Reform|reform||",
"B2|Gesellschaft|Nomen|Schwerpunkt|focus||",
"B2|Gesellschaft|Nomen|Selbstständigkeit|independence||",
"B2|Gesellschaft|Nomen|Tendenz|tendency||",
"B2|Gesellschaft|Nomen|Umsetzung|implementation||",
"B2|Gesellschaft|Nomen|Verbreitung|spread||",
"B2|Gesellschaft|Nomen|Verteilung|distribution||",
"B2|Gesellschaft|Nomen|Wandel|change||",
"B2|Gesellschaft|Nomen|Widerspruch|contradiction||",
"B2|Gesellschaft|Nomen|Zusammenfassung|summary||",
"B2|Gesellschaft|Nomen|Zuständigkeit|responsibility, jurisdiction||",

"B2|Wirtschaft|Nomen|Absatz|sales||",
"B2|Wirtschaft|Nomen|Anbieter|provider||",
"B2|Wirtschaft|Nomen|Angebot|offer, supply||",
"B2|Wirtschaft|Nomen|Auftrag|order, assignment||",
"B2|Wirtschaft|Nomen|Ausgabe|expenditure, edition||",
"B2|Wirtschaft|Nomen|Einnahme|income, revenue||",
"B2|Wirtschaft|Nomen|Finanzierung|financing||",
"B2|Wirtschaft|Nomen|Gewinn|profit||",
"B2|Wirtschaft|Nomen|Investition|investment||",
"B2|Wirtschaft|Nomen|Kapital|capital||",
"B2|Wirtschaft|Nomen|Konkurrenz|competition||",
"B2|Wirtschaft|Nomen|Krise|crisis||",
"B2|Wirtschaft|Nomen|Marktwirtschaft|market economy||",
"B2|Wirtschaft|Nomen|Nachfrage|demand||",
"B2|Wirtschaft|Nomen|Produktion|production||",
"B2|Wirtschaft|Nomen|Umsatz|turnover||",
"B2|Wirtschaft|Nomen|Wachstum|growth||",
"B2|Wirtschaft|Nomen|Wert|value||",
"B2|Wirtschaft|Nomen|Wettbewerb|competition||",
"B2|Wirtschaft|Nomen|Wirtschaft|economy||",
"B2|Wirtschaft|Nomen|Wirtschaftszweig|industry sector||",
"B2|Wirtschaft|Nomen|Zahlung|payment||",

"B2|Wissenschaft|Nomen|Analyse|analysis||",
"B2|Wissenschaft|Nomen|Beobachtung|observation||",
"B2|Wissenschaft|Nomen|Beweis|proof||",
"B2|Wissenschaft|Nomen|Daten|data||",
"B2|Wissenschaft|Nomen|Erkenntnis|insight||",
"B2|Wissenschaft|Nomen|Experiment|experiment||",
"B2|Wissenschaft|Nomen|Faktor|factor||",
"B2|Wissenschaft|Nomen|Forschungsgebiet|research field||",
"B2|Wissenschaft|Nomen|Hypothese|hypothesis||",
"B2|Wissenschaft|Nomen|Modell|model||",
"B2|Wissenschaft|Nomen|Prozess|process||",
"B2|Wissenschaft|Nomen|Studie|study||",
"B2|Wissenschaft|Nomen|Theorie|theory||",
"B2|Wissenschaft|Nomen|Untersuchung|investigation||",
"B2|Wissenschaft|Nomen|Verfahren|procedure||",
"B2|Wissenschaft|Nomen|Versuch|experiment||",
"B2|Wissenschaft|Nomen|Wirklichkeit|reality||",

"B2|Technik|Nomen|Anwendung|application||",
"B2|Technik|Nomen|Anschluss|connection||",
"B2|Technik|Nomen|Anlage|system, facility||",
"B2|Technik|Nomen|Aufnahme|recording, reception||",
"B2|Technik|Nomen|Benutzer|user||",
"B2|Technik|Nomen|Benutzeroberfläche|user interface||",
"B2|Technik|Nomen|Datei|file||",
"B2|Technik|Nomen|Datenbank|database||",
"B2|Technik|Nomen|Gerät|device||",
"B2|Technik|Nomen|Netzwerk|network||",
"B2|Technik|Nomen|Programm|program||",
"B2|Technik|Nomen|Programmierung|programming||",
"B2|Technik|Nomen|Software|software||",
"B2|Technik|Nomen|Speicher|storage, memory||",
"B2|Technik|Nomen|Technik|technology||",
"B2|Technik|Nomen|Technologie|technology||",
"B2|Technik|Nomen|Verbindung|connection||",
"B2|Technik|Nomen|Verzeichnis|directory||",
"B2|Technik|Nomen|Version|version||",
"B2|Technik|Nomen|Zugriff|access||",
"B2|Technik|Nomen|Schnittstelle|interface||",
"B2|Technik|Nomen|System|system||",
"B2|Technik|Nomen|Werkzeug|tool||",
"B2|Technik|Nomen|Anmeldung|login, registration||",

"B2|Kultur|Nomen|Ausstellung|exhibition||",
"B2|Kultur|Nomen|Bühne|stage||",
"B2|Kultur|Nomen|Darstellung|representation||",
"B2|Kultur|Nomen|Dichtung|poetry||",
"B2|Kultur|Nomen|Filmproduktion|film production||",
"B2|Kultur|Nomen|Gemälde|painting||",
"B2|Kultur|Nomen|Kunst|art||",
"B2|Kultur|Nomen|Künstler|artist||",
"B2|Kultur|Nomen|Künstlerin|female artist||",
"B2|Kultur|Nomen|Literatur|literature||",
"B2|Kultur|Nomen|Musiker|musician||",
"B2|Kultur|Nomen|Musikstück|piece of music||",
"B2|Kultur|Nomen|Roman|novel||",
"B2|Kultur|Nomen|Schauspiel|play, acting||",
"B2|Kultur|Nomen|Schauspieler|actor||",
"B2|Kultur|Nomen|Schauspielerin|actress||",
"B2|Kultur|Nomen|Szene|scene||",
"B2|Kultur|Nomen|Theater|theatre||",
"B2|Kultur|Nomen|Tradition|tradition||",
"B2|Kultur|Nomen|Veranstaltung|event||",

"B2|Verben|Verb|abgrenzen|to distinguish, delimit||",
"B2|Verben|Verb|ableiten|to derive||",
"B2|Verben|Verb|abwägen|to weigh up||",
"B2|Verben|Verb|annehmen|to assume, accept||",
"B2|Verben|Verb|aufweisen|to show, exhibit||",
"B2|Verben|Verb|auslösen|to trigger||",
"B2|Verben|Verb|beabsichtigen|to intend||",
"B2|Verben|Verb|bedingen|to cause, condition||",
"B2|Verben|Verb|begrenzen|to limit||",
"B2|Verben|Verb|beibehalten|to retain||",
"B2|Verben|Verb|beitragen|to contribute||",
"B2|Verben|Verb|bewirken|to cause||",
"B2|Verben|Verb|darlegen|to explain, set out||",
"B2|Verben|Verb|definieren|to define||",
"B2|Verben|Verb|einräumen|to concede, grant||",
"B2|Verben|Verb|einschränken|to restrict||",
"B2|Verben|Verb|entfallen|to be omitted||",
"B2|Verben|Verb|entsprechen|to correspond||",
"B2|Verben|Verb|erfassen|to record, grasp||",
"B2|Verben|Verb|erläutern|to explain||",
"B2|Verben|Verb|ermöglichen|to enable||",
"B2|Verben|Verb|erörtern|to discuss||",
"B2|Verben|Verb|festlegen|to establish||",
"B2|Verben|Verb|gewährleisten|to guarantee||",
"B2|Verben|Verb|hervorheben|to emphasize||",
"B2|Verben|Verb|kennzeichnen|to characterize||",
"B2|Verben|Verb|nachvollziehen|to understand, follow||",
"B2|Verben|Verb|prägen|to shape||",
"B2|Verben|Verb|voraussetzen|to presuppose||",
"B2|Verben|Verb|veranschaulichen|to illustrate||",
"B2|Verben|Verb|verbreiten|to spread||",
"B2|Verben|Verb|vermitteln|to convey||",
"B2|Verben|Verb|vernehmen|to hear, question||",
"B2|Verben|Verb|verschärfen|to intensify||",
"B2|Verben|Verb|verursachen|to cause||",
"B2|Verben|Verb|vorausgehen|to precede||",
"B2|Verben|Verb|widerspiegeln|to reflect||",
"B2|Verben|Verb|zusammenhängen|to be connected||",

"B2|Adjektive|Adjektiv|abstrakt|abstract||",
"B2|Adjektive|Adjektiv|akut|acute||",
"B2|Adjektive|Adjektiv|allgemeingültig|universally valid||",
"B2|Adjektive|Adjektiv|alternativ|alternative||",
"B2|Adjektive|Adjektiv|anspruchsvoll|demanding||",
"B2|Adjektive|Adjektiv|ausführlich|detailed||",
"B2|Adjektive|Adjektiv|autonom|autonomous||",
"B2|Adjektive|Adjektiv|beachtlich|considerable||",
"B2|Adjektive|Adjektiv|begrenzt|limited||",
"B2|Adjektive|Adjektiv|beträchtlich|considerable||",
"B2|Adjektive|Adjektiv|charakteristisch|characteristic||",
"B2|Adjektive|Adjektiv|dauerhaft|permanent||",
"B2|Adjektive|Adjektiv|effektiv|effective||",
"B2|Adjektive|Adjektiv|einheitlich|uniform||",
"B2|Adjektive|Adjektiv|entscheidend|decisive||",
"B2|Adjektive|Adjektiv|erheblich|considerable||",
"B2|Adjektive|Adjektiv|exakt|exact||",
"B2|Adjektive|Adjektiv|fortlaufend|ongoing||",
"B2|Adjektive|Adjektiv|grundsätzlich|fundamental||",
"B2|Adjektive|Adjektiv|individuell|individual||",
"B2|Adjektive|Adjektiv|komplex|complex||",
"B2|Adjektive|Adjektiv|konkret|concrete||",
"B2|Adjektive|Adjektiv|konsequent|consistent||",
"B2|Adjektive|Adjektiv|kritisch|critical||",
"B2|Adjektive|Adjektiv|langfristig|long-term||",
"B2|Adjektive|Adjektiv|maßgeblich|decisive||",
"B2|Adjektive|Adjektiv|methodisch|methodical||",
"B2|Adjektive|Adjektiv|nachhaltig|sustainable||",
"B2|Adjektive|Adjektiv|objektiv|objective||",
"B2|Adjektive|Adjektiv|offenbar|apparent||",
"B2|Adjektive|Adjektiv|potenziell|potential||",
"B2|Adjektive|Adjektiv|präzise|precise||",
"B2|Adjektive|Adjektiv|relevant|relevant||",
"B2|Adjektive|Adjektiv|stabil|stable||",
"B2|Adjektive|Adjektiv|subjektiv|subjective||",
"B2|Adjektive|Adjektiv|umfassend|comprehensive||",
"B2|Adjektive|Adjektiv|unmittelbar|immediate||",
"B2|Adjektive|Adjektiv|verbindlich|binding||",
"B2|Adjektive|Adjektiv|wesentlich|essential||",
"B2|Adjektive|Adjektiv|wirtschaftlich|economic||",

"B2|Ausdrücke|Ausdruck|allerdings|however||",
"B2|Ausdrücke|Ausdruck|außerdem|besides||",
"B2|Ausdrücke|Ausdruck|beispielsweise|for example||",
"B2|Ausdrücke|Ausdruck|daher|therefore||",
"B2|Ausdrücke|Ausdruck|dennoch|nevertheless||",
"B2|Ausdrücke|Ausdruck|demnach|accordingly||",
"B2|Ausdrücke|Ausdruck|folglich|consequently||",
"B2|Ausdrücke|Ausdruck|insbesondere|especially||",
"B2|Ausdrücke|Ausdruck|inzwischen|meanwhile||",
"B2|Ausdrücke|Ausdruck|jedoch|however||",
"B2|Ausdrücke|Ausdruck|keineswegs|by no means||",
"B2|Ausdrücke|Ausdruck|letztlich|ultimately||",
"B2|Ausdrücke|Ausdruck|mithin|thus||",
"B2|Ausdrücke|Ausdruck|schließlich|finally||",
"B2|Ausdrücke|Ausdruck|somit|thus||",
"B2|Ausdrücke|Ausdruck|stattdessen|instead||",
"B2|Ausdrücke|Ausdruck|überwiegend|predominantly||",
"B2|Ausdrücke|Ausdruck|übrigens|by the way||",
"B2|Ausdrücke|Ausdruck|vermutlich|presumably||",
"B2|Ausdrücke|Ausdruck|zunächst|initially||",
"B2|Ausdrücke|Ausdruck|einerseits|on the one hand||",
"B2|Ausdrücke|Ausdruck|andererseits|on the other hand||",
"B2|Ausdrücke|Ausdruck|im Allgemeinen|in general||",
"B2|Ausdrücke|Ausdruck|im Grunde|basically||",
"B2|Ausdrücke|Ausdruck|im Gegensatz dazu|in contrast||",
"B2|Ausdrücke|Ausdruck|auf diese Weise|in this way||",
"B2|Ausdrücke|Ausdruck|unter anderem|among other things||",
"B2|Ausdrücke|Ausdruck|zum Beispiel|for example||",
"B2|Ausdrücke|Ausdruck|aus diesem Grund|for this reason||",
"B2|Ausdrücke|Ausdruck|im Vergleich zu|in comparison with||",

"B2|Akademisch|Nomen|Argument|argument||",
"B2|Akademisch|Nomen|Argumentation|argumentation||",
"B2|Akademisch|Nomen|Aspekt|aspect||",
"B2|Akademisch|Nomen|Begriff|term, concept||",
"B2|Akademisch|Nomen|Definition|definition||",
"B2|Akademisch|Nomen|These|thesis||",
"B2|Akademisch|Nomen|Interpretation|interpretation||",
"B2|Akademisch|Nomen|Kriterium|criterion||",
"B2|Akademisch|Nomen|Merkmal|characteristic||",
"B2|Akademisch|Nomen|Persönlichkeit|personality||",
"B2|Akademisch|Nomen|Prinzip|principle||",
"B2|Akademisch|Nomen|Problemstellung|problem statement||",
"B2|Akademisch|Nomen|Schlussfolgerung|conclusion||",
"B2|Akademisch|Nomen|Strategie|strategy||",
"B2|Akademisch|Nomen|Vorgehensweise|procedure, approach||",
"B2|Akademisch|Nomen|Zielsetzung|objective||",
"B2|Akademisch|Nomen|Vermittlung|communication, mediation||",
"B2|Akademisch|Nomen|Bezug|reference, relation||",

"B2|Akademisch|Verb|argumentieren|to argue||",
"B2|Akademisch|Verb|begründen|to justify||",
"B2|Akademisch|Verb|belegen|to substantiate||",
"B2|Akademisch|Verb|differenzieren|to differentiate||",
"B2|Akademisch|Verb|interpretieren|to interpret||",
"B2|Akademisch|Verb|klassifizieren|to classify||",
"B2|Akademisch|Verb|kommentieren|to comment||",
"B2|Akademisch|Verb|konzentrieren|to concentrate||",
"B2|Akademisch|Verb|präzisieren|to specify||",
"B2|Akademisch|Verb|problematisieren|to problematize||",
"B2|Akademisch|Verb|recherchieren|to research||",
"B2|Akademisch|Verb|strukturieren|to structure||",
"B2|Akademisch|Verb|verallgemeinern|to generalize||",
"B2|Akademisch|Verb|zitieren|to quote||",
"B2|Akademisch|Verb|corrigieren|to correct||",
"B2|Akademisch|Verb|formulieren|to formulate||",

"B2|Beruf|Nomen|Arbeitsbedingung|working condition||",
"B2|Beruf|Nomen|Arbeitsgemeinschaft|working group||",
"B2|Beruf|Nomen|Arbeitsleistung|work performance||",
"B2|Beruf|Nomen|Arbeitsrecht|labour law||",
"B2|Beruf|Nomen|Beratung|consulting||",
"B2|Beruf|Nomen|Dienstleistung|service||",
"B2|Beruf|Nomen|Führungskraft|manager||",
"B2|Beruf|Nomen|Geschäftsführung|management||",
"B2|Beruf|Nomen|Kundenservice|customer service||",
"B2|Beruf|Nomen|Management|management||",
"B2|Beruf|Nomen|Personalabteilung|HR department||",
"B2|Beruf|Nomen|Qualitätskontrolle|quality control||",
"B2|Beruf|Nomen|Teamarbeit|teamwork||",
"B2|Beruf|Nomen|Verantwortungsbereich|area of responsibility||",
"B2|Beruf|Nomen|Verhandlungsführung|negotiation management||",
"B2|Beruf|Nomen|Wettbewerbsfähigkeit|competitiveness||",
"B2|Beruf|Nomen|Zuständigkeit|responsibility||",
"B2|Beruf|Nomen|Zuverlässigkeit|reliability||",
"B2|Beruf|Adjektiv|fachlich|professional, technical||",
"B2|Beruf|Adjektiv|finanziell|financial||",
"B2|Beruf|Adjektiv|strategisch|strategic||",
"B2|Beruf|Adjektiv|verhandlungssicher|fluent in negotiations||",
"B2|Beruf|Adjektiv|termingerecht|on schedule||",
"B2|Beruf|Adjektiv|zielorientiert|goal-oriented||",
"B2|Beruf|Adjektiv|kundenorientiert|customer-oriented||",
"B2|Beruf|Adjektiv|teamfähig|team-oriented||",
"B2|Beruf|Adjektiv|belastbar|resilient||",

"B2|Erweiterung|Wort|Abenteuer|adventure||",
"B2|Erweiterung|Wort|Abschätzung|estimation||",
"B2|Erweiterung|Wort|Anforderung|requirement||",
"B2|Erweiterung|Wort|Anordnung|arrangement, order||",
"B2|Erweiterung|Wort|Anreiz|incentive||",
"B2|Erweiterung|Wort|Aufmerksamkeit|attention||",
"B2|Erweiterung|Wort|Ausführung|execution||",
"B2|Erweiterung|Wort|Ausdrucksweise|way of expression||",
"B2|Erweiterung|Wort|Begegnung|encounter||",
"B2|Erweiterung|Wort|Beobachter|observer||",
"B2|Erweiterung|Wort|Beobachterin|female observer||",
"B2|Erweiterung|Wort|Beurteilung|assessment||",
"B2|Erweiterung|Wort|Beteiligung|participation||",
"B2|Erweiterung|Wort|Durchführung|implementation||",
"B2|Erweiterung|Wort|Einheit|unit||",
"B2|Erweiterung|Wort|Entstehung|emergence||",
"B2|Erweiterung|Wort|Erfordernis|requirement||",
"B2|Erweiterung|Wort|Erkenntnis|insight||",
"B2|Erweiterung|Wort|Erscheinung|appearance, phenomenon||",
"B2|Erweiterung|Wort|Festlegung|determination||",
"B2|Erweiterung|Wort|Förderung|promotion, funding||",
"B2|Erweiterung|Wort|Gegebenheit|given circumstance||",
"B2|Erweiterung|Wort|Gegenstand|object, subject||",
"B2|Erweiterung|Wort|Gestaltung|design||",
"B2|Erweiterung|Wort|Handhabung|handling||",
"B2|Erweiterung|Wort|Herausgabe|publication||",
"B2|Erweiterung|Wort|Klarheit|clarity||",
"B2|Erweiterung|Wort|Kompetenz|competence||",
"B2|Erweiterung|Wort|Konfrontation|confrontation||",
"B2|Erweiterung|Wort|Lösung|solution||",
"B2|Erweiterung|Wort|Mitwirkung|participation||",
"B2|Erweiterung|Wort|Nachhaltigkeit|sustainability||",
"B2|Erweiterung|Wort|Nutzung|use||",
"B2|Erweiterung|Wort|Realisierung|realization||",
"B2|Erweiterung|Wort|Richtigkeit|correctness||",
"B2|Erweiterung|Wort|Schlussfolgerung|conclusion||",
"B2|Erweiterung|Wort|Selbstständigkeit|independence||",
"B2|Erweiterung|Wort|Sichtweise|perspective||",
"B2|Erweiterung|Wort|Stärkung|strengthening||",
"B2|Erweiterung|Wort|Überlegung|consideration||",
"B2|Erweiterung|Wort|Überblick|overview||",
"B2|Erweiterung|Wort|Umgang|handling||",
"B2|Erweiterung|Wort|Ursache|cause||",
"B2|Erweiterung|Wort|Verlauf|course||",
"B2|Erweiterung|Wort|Veröffentlichung|publication||",
"B2|Erweiterung|Wort|Wert|value||",
"B2|Erweiterung|Wort|Wirklichkeit|reality||",
"B2|Erweiterung|Wort|Zweifel|doubt||",
"B2|Erweiterung|Wort|Anspruch|claim, entitlement||",
"B2|Erweiterung|Wort|Befragung|survey, questioning||",
"B2|Erweiterung|Wort|Bestätigung|confirmation||",
"B2|Erweiterung|Wort|Einführung|introduction||",
"B2|Erweiterung|Wort|Einschränkung|restriction||",
"B2|Erweiterung|Wort|Ergänzung|addition||",
"B2|Erweiterung|Wort|Erhebung|survey, collection||",
"B2|Erweiterung|Wort|Erweiterung|extension||",
"B2|Erweiterung|Wort|Fachgebiet|field of study||",
"B2|Erweiterung|Wort|Fortsetzung|continuation||",
"B2|Erweiterung|Wort|Gegenteil|opposite||",
"B2|Erweiterung|Wort|Leitfaden|guide||",
"B2|Erweiterung|Wort|Notwendigkeit|necessity||",
"B2|Erweiterung|Wort|Rahmen|framework||",
"B2|Erweiterung|Wort|Richtlinie|guideline||",
"B2|Erweiterung|Wort|Rückgang|decline||",
"B2|Erweiterung|Wort|Schritt|step||",
"B2|Erweiterung|Wort|Überzeugung|conviction||",
"B2|Erweiterung|Wort|Verlässlichkeit|reliability||",
"B2|Erweiterung|Wort|Verwendung|use||",
"B2|Erweiterung|Wort|Vorbild|role model||",
"B2|Erweiterung|Wort|Verknüpfung|linking||",
"B2|Erweiterung|Wort|Vermögen|assets, ability||",
"B2|Erweiterung|Wort|Vernetzung|networking||",
"B2|Erweiterung|Wort|Verordnung|regulation||",
"B2|Erweiterung|Wort|Vertretung|representation||",
"B2|Erweiterung|Wort|Vorstellung|idea, presentation||",
"B2|Erweiterung|Wort|Wirksamkeit|effectiveness||",
"B2|Erweiterung|Wort|Würdigung|appreciation||",
"B2|Erweiterung|Wort|Zweckmäßigkeit|appropriateness||",
"B2|Erweiterung|Wort|Einflussnahme|influence||",
"B2|Erweiterung|Wort|Forschungsergebnis|research result||",
"B2|Erweiterung|Wort|Grundsatz|principle||",
"B2|Erweiterung|Wort|Lebensqualität|quality of life||"
];

/* =========================================================
   NORMALIZE VOCABULARY
========================================================= */

const vocabularyWords = vocabularySeed.map((entry) => {
    const [
        level,
        category,
        type,
        word,
        english,
        article,
        plural
    ] = entry.split("|");

    return {
        level: level || "A1",
        category: category || "Alltag",
        type: type || "Wort",
        word: word || "",
        english: english || "",
        article: article || "",
        plural: plural || "",
        example: createDefaultExample(
            word || "",
            type || "Wort"
        )
    };
});
/* =========================================================
   CATEGORY NORMALIZATION
========================================================= */

const CATEGORY_MAP = {
    "Everyday": "Alltag",
    "Work": "Arbeit",
    "Travel": "Reisen",
    "People": "Gesellschaft"
};

function normalizeCategory(category) {

    if (!category) {
        return "All";
    }

    return CATEGORY_MAP[category] ||
        category;
}

/* =========================================================
   DEFAULT EXAMPLES
========================================================= */

function createDefaultExample(word, type) {

    if (!word) {
        return "";
    }

    if (type === "Nomen") {
        return `Heute lerne ich das Wort „${word}“.`;
    }

    if (type === "Verb") {
        return `Heute lerne ich, wie man „${word}“ benutzt.`;
    }

    if (type === "Adjektiv") {
        return `Heute lerne ich das Adjektiv „${word}“.`;
    }

    return `Heute lerne ich den Ausdruck „${word}“.`;
}

/* =========================================================
   DOM
========================================================= */

let wordGrid;
let emptyState;
let wordSearch;
let levelFilter;
let randomWordBtn;

let wordsLearned;
let wordsReviewed;
let vocabularyStreak;

let categoryFilter;
let loadMoreBtn;
let resultCount;

/* =========================================================
   STATE
========================================================= */

let currentCategory = "All";
let currentLevel = "All";
let currentSearch = "";

let renderedCount = 0;

let favorites = [];

let vocabularyStats = {
    learned: 0,
    reviewed: 0,
    streak: 0,
    lastStudyDate: null,
    learnedWords: []
};

/* =========================================================
   SESSION
========================================================= */

function getStudentToken() {
    return localStorage.getItem(
        STUDENT_TOKEN_KEY
    );
}

function getStudentData() {

    try {

        return JSON.parse(
            localStorage.getItem(
                STUDENT_DATA_KEY
            ) || "null"
        );

    } catch (error) {

        console.warn(
            "Could not read student data.",
            error
        );

        return null;
    }
}

function hasStudentSession() {
    return Boolean(
        getStudentToken()
    );
}

/* =========================================================
   API
========================================================= */

async function studentFetch(
    endpoint,
    options = {}
) {

    const token =
        getStudentToken();

    if (!token) {
        return null;
    }

    const headers = {
        ...(options.headers || {}),
        Authorization:
            `Bearer ${token}`,
        "Content-Type":
            "application/json"
    };

    try {

        const response =
            await fetch(
                `${API_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            logoutStudent();

            return null;
        }

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            return await response.json();
        }

        return await response.text();

    } catch (error) {

        console.warn(
            `Student API request failed: ${endpoint}`,
            error
        );

        return null;
    }
}

/* =========================================================
   LOGOUT
========================================================= */

function logoutStudent() {

    localStorage.removeItem(
        STUDENT_TOKEN_KEY
    );

    localStorage.removeItem(
        STUDENT_DATA_KEY
    );

    window.location.href =
        "../login.html";
}

/* =========================================================
   FAVORITES
========================================================= */

function loadFavorites() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    FAVORITES_KEY
                ) || "[]"
            );

        favorites =
            Array.isArray(saved)
                ? saved
                : [];

    } catch (error) {

        favorites = [];
    }
}

function saveFavorites() {

    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(
            favorites
        )
    );
}

function isFavorite(word) {

    return favorites.some(
        favorite =>
            String(
                favorite
            ).toLowerCase() ===
            String(
                word
            ).toLowerCase()
    );
}

function toggleFavorite(word) {

    const index =
        favorites.findIndex(
            favorite =>
                String(
                    favorite
                ).toLowerCase() ===
                String(
                    word
                ).toLowerCase()
        );

    if (index >= 0) {

        favorites.splice(
            index,
            1
        );

        showMessage(
            "Aus Favoriten entfernt."
        );

    } else {

        favorites.push(
            word
        );

        showMessage(
            "Zu Favoriten hinzugefügt."
        );
    }

    saveFavorites();

    renderVocabulary();
}

/* =========================================================
   STATS
========================================================= */

function loadVocabularyStats() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    VOCAB_STATS_KEY
                ) || "{}"
            );

        vocabularyStats = {

            learned:
                Number(
                    saved.learned
                ) || 0,

            reviewed:
                Number(
                    saved.reviewed
                ) || 0,

            streak:
                Number(
                    saved.streak
                ) || 0,

            lastStudyDate:
                saved.lastStudyDate ||
                null,

            learnedWords:
                Array.isArray(
                    saved.learnedWords
                )
                    ? saved.learnedWords
                    : []
        };

    } catch (error) {

        vocabularyStats = {

            learned: 0,
            reviewed: 0,
            streak: 0,
            lastStudyDate: null,
            learnedWords: []
        };
    }
}

function saveVocabularyStats() {

    localStorage.setItem(
        VOCAB_STATS_KEY,
        JSON.stringify(
            vocabularyStats
        )
    );
}

function getLocalDateKey(
    date = new Date()
) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");
}

function updateVocabularyStreak() {

    const today =
        getLocalDateKey();

    if (
        !vocabularyStats.lastStudyDate
    ) {

        vocabularyStats.streak =
            1;

        vocabularyStats.lastStudyDate =
            today;

        return;
    }

    if (
        vocabularyStats.lastStudyDate ===
        today
    ) {

        return;
    }

    const previous =
        new Date(
            `${vocabularyStats.lastStudyDate}T00:00:00`
        );

    const current =
        new Date(
            `${today}T00:00:00`
        );

    const difference =
        Math.round(
            (
                current -
                previous
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )
        );

    if (
        difference === 1
    ) {

        vocabularyStats.streak +=
            1;

    } else {

        vocabularyStats.streak =
            1;
    }

    vocabularyStats.lastStudyDate =
        today;
}

function updateStatsUI() {

    if (wordsLearned) {

        wordsLearned.textContent =
            Number(
                vocabularyStats.learned
            ) || 0;
    }

    if (wordsReviewed) {

        wordsReviewed.textContent =
            Number(
                vocabularyStats.reviewed
            ) || 0;
    }

    if (vocabularyStreak) {

        vocabularyStreak.textContent =
            Number(
                vocabularyStats.streak
            ) || 0;
    }
}

/* =========================================================
   MARK WORD AS LEARNED
========================================================= */

async function markWordAsLearned(
    word
) {

    if (
        !word ||
        !word.word
    ) {

        return;
    }

    const alreadyLearned =
        vocabularyStats
            .learnedWords
            .some(
                savedWord =>
                    String(
                        savedWord
                    ).toLowerCase() ===
                    String(
                        word.word
                    ).toLowerCase()
            );

    if (!alreadyLearned) {

        vocabularyStats
            .learnedWords
            .push(
                word.word
            );

        vocabularyStats.learned +=
            1;
    }

    vocabularyStats.reviewed +=
        1;

    updateVocabularyStreak();

    saveVocabularyStats();

    updateStatsUI();

    showMessage(
        `„${word.word}“ wurde als gelernt markiert.`
    );

    if (
        hasStudentSession()
    ) {

        await studentFetch(
            "/student/vocabulary/progress",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        word:
                            word.word,

                        level:
                            word.level,

                        category:
                            word.category,

                        learned:
                            true
                    })
            }
        );
    }
}

/* =========================================================
   FILTERING
========================================================= */

function getFilteredWords() {

    const query =
        currentSearch
            .trim()
            .toLowerCase();

    return vocabularyWords.filter(
        word => {

            const matchesCategory =
                currentCategory ===
                    "All" ||
                word.category ===
                    currentCategory;

            const matchesLevel =
                currentLevel ===
                    "All" ||
                word.level ===
                    currentLevel;

            if (
                !matchesCategory ||
                !matchesLevel
            ) {

                return false;
            }

            if (!query) {

                return true;
            }

            const searchableText = [

                word.word,
                word.english,
                word.article,
                word.plural,
                word.level,
                word.category,
                word.type,
                word.example

            ]
                .join(" ")
                .toLowerCase();

            return searchableText
                .includes(query);
        }
    );
}

/* =========================================================
   CATEGORY BUTTONS
========================================================= */

function setupCategoryButtons() {

    document
        .querySelectorAll(
            ".category-card"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        currentCategory =
                            normalizeCategory(
                                button.dataset.category ||
                                "All"
                            );

                        document
                            .querySelectorAll(
                                ".category-card"
                            )
                            .forEach(
                                item => {

                                    const itemCategory =
                                        normalizeCategory(
                                            item.dataset.category ||
                                            "All"
                                        );

                                    item.classList.toggle(
                                        "active",
                                        itemCategory ===
                                            currentCategory
                                    );
                                }
                            );

                        if (
                            categoryFilter
                        ) {

                            categoryFilter.value =
                                currentCategory;
                        }

                        currentSearch =
                            "";

                        if (wordSearch) {

                            wordSearch.value =
                                "";
                        }

                        renderedCount =
                            0;

                        renderVocabulary();
                    }
                );
            }
        );
}
function createCategoryFilter() {

    if (!levelFilter) {
        return;
    }

    categoryFilter =
        document.getElementById(
            "categoryFilter"
        );

    if (!categoryFilter) {

        categoryFilter =
            document.createElement(
                "select"
            );

        categoryFilter.id =
            "categoryFilter";

        categoryFilter.className =
            levelFilter.className;

        const categories =
            [
                ...new Set(
                    vocabularyWords
                        .map(
                            word =>
                                word.category
                        )
                        .filter(Boolean)
                )
            ].sort(
                (a, b) =>
                    a.localeCompare(
                        b,
                        "de"
                    )
            );

        categoryFilter.innerHTML =
            `
            <option value="All">
                All Categories
            </option>
            ` +
            categories
                .map(
                    category =>
                        `
                        <option value="${escapeHTML(category)}">
                            ${escapeHTML(category)}
                        </option>
                        `
                )
                .join("");

        levelFilter.insertAdjacentElement(
            "afterend",
            categoryFilter
        );
    }

    categoryFilter.addEventListener(
        "change",
        () => {

            currentCategory =
                normalizeCategory(
                    categoryFilter.value ||
                    "All"
                );

            document
                .querySelectorAll(
                    ".category-card"
                )
                .forEach(
                    button => {

                        const buttonCategory =
                            normalizeCategory(
                                button.dataset.category ||
                                "All"
                            );

                        button.classList.toggle(
                            "active",
                            buttonCategory ===
                                currentCategory
                        );
                    }
                );

            renderedCount = 0;

            renderVocabulary();
        }
    );
}

/* =========================================================
   RESULT COUNT
========================================================= */

function updateResultCount(
    total
) {

    if (!resultCount) {
        return;
    }

    resultCount.textContent =
        `${total.toLocaleString()} Wörter`;
}

/* =========================================================
   LOAD MORE
========================================================= */

function createLoadMoreButton() {

    if (
        !wordGrid ||
        loadMoreBtn
    ) {

        return;
    }

    loadMoreBtn =
        document.createElement(
            "button"
        );

    loadMoreBtn.type =
        "button";

    loadMoreBtn.id =
        "loadMoreWordsBtn";

    loadMoreBtn.className =
        "load-more-words-btn";

    loadMoreBtn.textContent =
        "Mehr Wörter laden";

    loadMoreBtn.style.cssText = `
        display: block;
        margin: 28px auto 10px;
        padding: 12px 22px;
        border: 1px solid rgba(212,175,55,.45);
        border-radius: 12px;
        background: #d4af37;
        color: #000;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        transition: .2s ease;
    `;

    loadMoreBtn.addEventListener(
        "click",
        () =>
            renderVocabulary(
                true
            )
    );

    wordGrid.insertAdjacentElement(
        "afterend",
        loadMoreBtn
    );
}

/* =========================================================
   RENDER VOCABULARY
========================================================= */

function renderVocabulary(
    append = false
) {

    if (!wordGrid) {
        return;
    }

    const filteredWords =
        getFilteredWords();

    updateResultCount(
        filteredWords.length
    );

    if (!append) {

        wordGrid.innerHTML =
            "";

        renderedCount =
            0;
    }

    if (
        !filteredWords.length
    ) {

        wordGrid.innerHTML =
            "";

        if (emptyState) {

            emptyState.style.display =
                "block";
        }

        renderedCount =
            0;

        if (loadMoreBtn) {

            loadMoreBtn.style.display =
                "none";
        }

        return;
    }

    if (emptyState) {

        emptyState.style.display =
            "none";
    }

    const nextWords =
        filteredWords.slice(
            renderedCount,
            renderedCount +
                WORDS_PER_BATCH
        );

    nextWords.forEach(
        word => {

            wordGrid.appendChild(
                createWordCard(
                    word
                )
            );
        }
    );

    renderedCount +=
        nextWords.length;

    if (loadMoreBtn) {

        const remaining =
            filteredWords.length -
            renderedCount;

        const hasMore =
            remaining > 0;

        loadMoreBtn.style.display =
            hasMore
                ? "block"
                : "none";

        if (hasMore) {

            loadMoreBtn.textContent =
                `Mehr Wörter laden (${Math.min(
                    WORDS_PER_BATCH,
                    remaining
                )})`;
        }
    }
}

/* =========================================================
   WORD CARD
========================================================= */

function createWordCard(
    word
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "word-card";

    card.dataset.word =
        word.word;

    card.dataset.level =
        word.level;

    card.dataset.category =
        word.category;

    const favorite =
        isFavorite(
            word.word
        );

    const top =
        document.createElement(
            "div"
        );

    top.className =
        "word-card-top";

    const badges =
        document.createElement(
            "div"
        );

    badges.className =
        "word-badges";

    const level =
        document.createElement(
            "span"
        );

    level.className =
        "word-level";

    level.textContent =
        word.level;

    const category =
        document.createElement(
            "span"
        );

    category.className =
        "word-category";

    category.textContent =
        word.category;

    badges.append(
        level,
        category
    );

    const favoriteButton =
        document.createElement(
            "button"
        );

    favoriteButton.type =
        "button";

    favoriteButton.className =
        "favorite-btn";

    favoriteButton.setAttribute(
        "aria-label",

        favorite
            ? `Remove ${word.word} from favorites`
            : `Add ${word.word} to favorites`
    );

    favoriteButton.textContent =
        favorite
            ? "★"
            : "☆";

    if (favorite) {

        favoriteButton.classList.add(
            "active"
        );
    }

    favoriteButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleFavorite(
                word.word
            );
        }
    );

    top.append(
        badges,
        favoriteButton
    );

    const wordTitle =
        document.createElement(
            "h3"
        );

    wordTitle.className =
        "word";

    if (word.article) {

        const article =
            document.createElement(
                "span"
            );

        article.className =
            "word-article";

        article.textContent =
            `${word.article} `;

        wordTitle.appendChild(
            article
        );
    }

    wordTitle.appendChild(
        document.createTextNode(
            word.word
        )
    );

    const type =
        document.createElement(
            "p"
        );

    type.className =
        "word-type";

    type.textContent =
        word.type ||
        "Wort";

    const meaning =
        document.createElement(
            "p"
        );

    meaning.className =
        "word-meaning";

    meaning.textContent =
        word.english;

    const details =
        document.createElement(
            "div"
        );

    details.className =
        "word-details";

    if (word.plural) {

        const plural =
            document.createElement(
                "span"
            );

        plural.textContent =
            `Plural: ${word.plural}`;

        details.appendChild(
            plural
        );
    }

    const example =
        document.createElement(
            "p"
        );

    example.className =
        "word-example";

    example.textContent =
        word.example;

    const learnButton =
        document.createElement(
            "button"
        );

    learnButton.type =
        "button";

    learnButton.className =
        "learn-word-btn";

    learnButton.textContent =
        "✓ Gelernt";

    learnButton.addEventListener(
        "click",
        () =>
            markWordAsLearned(
                word
            )
    );

    card.append(
        top,
        wordTitle,
        type,
        meaning
    );

    if (
        details.childElementCount
    ) {

        card.appendChild(
            details
        );
    }

    card.append(
        example,
        learnButton
    );

    return card;
}

/* =========================================================
   RANDOM WORD
========================================================= */

function randomWord() {

    const filteredWords =
        getFilteredWords();

    if (
        !filteredWords.length
    ) {

        showMessage(
            "Keine Wörter für diesen Filter gefunden."
        );

        return;
    }

    const word =
        filteredWords[
            Math.floor(
                Math.random() *
                filteredWords.length
            )
        ];

    currentSearch =
        word.word;

    if (wordSearch) {

        wordSearch.value =
            word.word;
    }

    renderVocabulary();

    requestAnimationFrame(
        () => {

            const card =
                document.querySelector(
                    `[data-word="${CSS.escape(
                        word.word
                    )}"]`
                );

            if (!card) {
                return;
            }

            card.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "center"
            });

            card.classList.add(
                "random-highlight"
            );

            setTimeout(
                () =>
                    card.classList.remove(
                        "random-highlight"
                    ),
                1800
            );
        }
    );
}

/* =========================================================
   STUDENT PROFILE
========================================================= */

async function loadStudentProfile() {

    if (
        !hasStudentSession()
    ) {

        return;
    }

    const student =
        getStudentData();

    if (!student) {
        return;
    }

    const name =
        student.firstName ||
        student.first_name ||
        student.name ||
        "";

    if (!name) {
        return;
    }

    document
        .querySelectorAll(
            "[data-student-name]"
        )
        .forEach(
            element =>
                element.textContent =
                    name
        );
}

/* =========================================================
   TOAST
========================================================= */

function showMessage(
    message
) {

    let toast =
        document.getElementById(
            "vocabularyToast"
        );

    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "vocabularyToast";

        toast.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 9999;
            max-width: 340px;
            padding: 13px 17px;
            border: 1px solid rgba(212,175,55,.45);
            border-radius: 12px;
            background: #111;
            color: #fff;
            box-shadow: 0 14px 35px rgba(0,0,0,.35);
            font-family: inherit;
            font-size: 14px;
            line-height: 1.45;
            transition: opacity .2s ease;
        `;

        document.body.appendChild(
            toast
        );
    }

    toast.textContent =
        message;

    toast.style.opacity =
        "1";

    clearTimeout(
        toast._timer
    );

    toast._timer =
        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

            },
            2200
        );
}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    const element =
        document.createElement(
            "div"
        );

    element.textContent =
        String(
            value ?? ""
        );

    return element.innerHTML;
}

/* =========================================================
   LOGOUT BUTTON
========================================================= */

function setupLogout() {

    document
        .querySelectorAll(
            "#logoutBtn, [data-logout]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        logoutStudent();
                    }
                );
            }
        );
}

/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    if (!wordSearch) {
        return;
    }

    wordSearch.addEventListener(
        "input",
        () => {

            currentSearch =
                wordSearch.value;

            renderVocabulary();
        }
    );
}

/* =========================================================
   LEVEL FILTER
========================================================= */

function setupLevelFilter() {

    if (!levelFilter) {
        return;
    }

    levelFilter.addEventListener(
        "change",
        () => {

            currentLevel =
                levelFilter.value ||
                "All";

            renderVocabulary();
        }
    );
}

/* =========================================================
   RANDOM BUTTON
========================================================= */

function setupRandomButton() {

    if (!randomWordBtn) {
        return;
    }

    randomWordBtn.addEventListener(
        "click",
        randomWord
    );
}

/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            const target =
                event.target;

            const isTyping =
                target instanceof
                    HTMLInputElement ||
                target instanceof
                    HTMLTextAreaElement ||
                target instanceof
                    HTMLSelectElement;

            if (
                event.key === "/" &&
                !isTyping
            ) {

                event.preventDefault();

                if (wordSearch) {

                    wordSearch.focus();
                }
            }

            if (
                event.key.toLowerCase() ===
                    "r" &&
                !isTyping
            ) {

                randomWord();
            }

            if (
                event.key ===
                    "Escape" &&
                wordSearch
            ) {

                currentSearch =
                    "";

                wordSearch.value =
                    "";

                renderVocabulary();
            }
        }
    );
}

/* =========================================================
   DEBUG SUMMARY
========================================================= */

function logVocabularySummary() {

    const counts =
        vocabularyWords.reduce(
            (result, word) => {

                result[word.level] =
                    (
                        result[word.level] ||
                        0
                    ) + 1;

                return result;

            },
            {}
        );

    console.log(
        "LINGUA DEUTSCH CONNECT vocabulary:",
        vocabularyWords.length,
        counts
    );
}

/* =========================================================
   INIT
========================================================= */

function initVocabulary() {

    wordGrid =
        document.getElementById(
            "wordGrid"
        );

    emptyState =
        document.getElementById(
            "emptyState"
        );

    wordSearch =
        document.getElementById(
            "wordSearch"
        );

    levelFilter =
        document.getElementById(
            "levelFilter"
        );

    randomWordBtn =
        document.getElementById(
            "randomWordBtn"
        );

    wordsLearned =
        document.getElementById(
            "wordsLearned"
        );

    wordsReviewed =
        document.getElementById(
            "wordsReviewed"
        );

    vocabularyStreak =
        document.getElementById(
            "vocabularyStreak"
        );

    resultCount =
        document.getElementById(
            "vocabularyResultCount"
        );

    loadFavorites();

    loadVocabularyStats();

    setupCategoryButtons();

    createCategoryFilter();

    createLoadMoreButton();

    setupSearch();

    setupLevelFilter();

    setupRandomButton();

    setupLogout();

    setupKeyboardShortcuts();

    updateStatsUI();

    renderVocabulary();

    loadStudentProfile();

    logVocabularySummary();
}
/* =========================================================
   START
========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initVocabulary
    );

} else {

    initVocabulary();

}