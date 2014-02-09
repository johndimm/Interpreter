var g_token = '';

function startButton() {
  // Are we currently showing the textarea?
  var textDisplay = $("#resultsText").css("display");
  if (textDisplay == 'block') {
    // Switch to textarea to accept text input
    useTextInput();
  } else {
    // Turn speech recognition on or off.
    startAudioButton(!g_recognizing);
  }
}

function onLoad() {
  for (var i = 0; i < langs.length; i++) {
    select_language.options[i] = new Option(langs[i][0], i);
  }
  select_language.selectedIndex = 6;
  updateCountry();
  select_dialect.selectedIndex = 6;

  select_target_language.selectedIndex = 9;
  updateTargetCountry();
  //  select_target_dialect.selectedIndex = 9;

  selectEngine("Bing");
  
  // Get an access token now.  Good for 10 minutes.
  getToken();
  
  // Get a new one every 9 minutes.
  setInterval(getToken, 9 * 60 * 1000);
  
  // Start up with the two buttons on.
  var e;
  startAudioButton(true);
  speakerButtonClick(e); 
}

function useTextInput() {}

function onResize() {}

function updateBacktransTitle() {
  var longLangName = select_language.selectedOptions[0].innerHTML;
  var longTargetLangName = select_target_language.selectedOptions[0].innerHTML;
   
  var accent = "<span style='float:right'>accent: <input id='accent' type='checkbox'> " + longTargetLangName + "</span>";
  $("#Backtrans_logTitle").html(longLangName + " back-translation " + accent);
}

function updateCountry() {
  for (var i = select_dialect.options.length - 1; i >= 0; i--) {
    select_dialect.remove(i);
  }
  var list = langs[select_language.selectedIndex];
  for (var i = 1; i < list.length; i++) {
    select_dialect.options.add(new Option(list[i][1], list[i][0]));
  }
  if (list[1].length == 1) {
    select_dialect.style.visibility = 'hidden';
//    bounceLanguage();
  } else {
    select_dialect.style.visibility = 'visible';
  }

  updateDirection("resultsContainer", sourceLanguage());
  
  var longLangName = select_language.selectedOptions[0].innerHTML;
  
  $("#source_logTitle").html(longLangName);
  
  updateBacktransTitle();
}

function updateDirection(resultsContainer, sourceLanguage) {
  var floatVal = sourceLanguage == 'ar' ? "left" : "right";
  $("#" + resultsContainer).css("float", floatVal);
  var direction = sourceLanguage == 'ar' ? "rtl" : "ltr";
  $("#" + resultsContainer).css("direction", direction);
}

function updateTargetCountry() {
  for (var i = select_target_dialect.options.length - 1; i >= 0; i--) {
    select_target_dialect.remove(i);
  }
  var list = langs[select_target_language.selectedIndex];
  for (var i = 1; i < list.length; i++) {
    select_target_dialect.options.add(new Option(list[i][1], list[i][0]));
  }

  updateDirection("targetResultsContainer", targetLanguage());
  
   var longLangName = select_target_language.selectedOptions[0].innerHTML;
   $("#Bing_logTitle").html(longLangName);

   updateBacktransTitle();
   
  // Don't make the dialect selector visible for target side.
  return;

  if (list[1].length == 1) {
    select_target_dialect.style.visibility = 'hidden';
  } else {
    select_target_dialect.style.visibility = 'visible';
  }
}

function reverse() {
  var target = select_target_language.selectedIndex;
  var source = select_language.selectedIndex;
  var targetDialect = select_target_dialect.selectedIndex;
  var sourceDialect = select_dialect.selectedIndex;
 
  select_target_language.selectedIndex = source;
  updateTargetCountry();
  
  select_target_dialect.selectedIndex = sourceDialect;
  select_language.selectedIndex = target;
  updateCountry();
  
  select_dialect.selectedIndex = targetDialect;
}

function searchInternet(query, nHits) {}

function onSpeechEnd() {
  processCompletePhrase();
}

function html5_audio() {
  var a = document.createElement('audio');
  return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
}

var play_html5_audio = false;
if (html5_audio()) play_html5_audio = true;

function play_sound(url) {
  if (play_html5_audio) {
    var snd = new Audio(url);
    console.log(url);
    snd.load();
    snd.play();
    snd.addEventListener("ended", onEnded);
    snd.addEventListener("error", onEnded);
  } else {
    $("#sound").remove();
    var sound = $("<embed id='sound' type='audio/mpeg' />");
    sound.attr('src', url);
    sound.attr('loop', false);
    sound.attr('hidden', true);
    sound.attr('autostart', true);
    $('body').append(sound);
  }
}

function sourceLanguageLong() {
  //return select_dialect;
}

function sourceLanguage() {
  return select_dialect.value.replace(/-.*/, '').replace("cmn", "zh");
}

function targetLanguage() {
  return select_target_dialect.value.replace(/-.*/, '').replace("cmn", "zh");
}

var g_selectedEngine = "";

function selectEngine(engine) {
  // Remove highlight from currently selected engine's log div
  if (g_selectedEngine) 
    $("#" + g_selectedEngine + "_logTitle").css("background", "#444");

  g_selectedEngine = engine;
  
  // Highlight newly selected engine.
  $("#" + g_selectedEngine + "_logTitle").css("background", "darkred");
}

function displayTranslatedText(txt, engine) {
  // Convert SYSTRAN RBMT to SYSTRAN_RBMT, since it's used in a div name.
  console.log ("displayTranslatedText, txt=" + txt + " engine=" + engine);
  engine = engine.replace(/\s/g, '_');
  if (txt.substr(0, 1) == '{' && txt.substr("error")) return;
  var logDiv = $("#" + engine + "_log");
  logDiv.html(logDiv.html() + " " + txt);

  if (engine == g_selectedEngine) {
    var theDiv = $("#targetResultsContainer");
	theDiv.html(theDiv.html() + ' ' + txt);
//    targetResultsContainer.innerHTML += ' ' + txt;

    if (engine != "Backtrans") {
	  voiceLang = targetLanguage();
	} else {
	  	voiceLang = ($("#accent").is (":checked")) ? targetLanguage() : sourceLanguage();
	}

    speak();
  }
}

var g_speakerOn = false;

function speakerButtonClick(event) {
  g_speakerOn = !g_speakerOn;
  speakerButtonImg.src = g_speakerOn ? "./talkshow/speaker_on.gif" : "./talkshow/speaker.gif";

}

function translate_old(txt, engine) {

  if (sourceLanguage() == targetLanguage()) {
    displayTranslatedText(txt, engine);
    return;
  }

  var transURL = "http://dictfactory.systran.local/frontend_dev.php/xtrans?txt=" + encodeURIComponent(txt) 
	+ "&lp=" + sourceLanguage() + targetLanguage() 
	+ "&engines=" + engine
  //	+ "&callback=?"
  ;

  console.log(transURL);

  var proxyURL = "./talkshow/simple_proxy.php?url=" + encodeURIComponent(transURL) + "&callback=?";

  console.log(proxyURL);

  //    $.getJSON(proxyURL, function(data) {
  //       var transText = data[0].txt;
  //       var engine = data[0].system;
  //          translation_div.innerHTML += ' ' + transText;
  //          speak();
  //	});
  $.ajax({
    url: proxyURL,
    type: 'GET',
    success: function (data, status) {
      var results = JSON.parse(data);
      var transText = results[0].txt;
      var engine = results[0].system;
      displayTranslatedText(transText, engine);
    },
    error: function (jqXHR, textStatus, errorThrown) {
      alert(textStatus);
    }
  });

}

var g_speaking = false;
var g_speechBuffer = '';
var voiceLang = '';

function onEnded() {
  speakChunk();
}

function speakChunk() {

  console.log("speakChunk: g_speechBuffer=" + g_speechBuffer);

  // Take the next chunk off the top.
  var truncated = g_speechBuffer.length >= 100;
  var nextChunk = g_speechBuffer.substr(0, 100).trim();
  if (nextChunk == '') {
    console.log("nothing left in speech queue");

    // Turn microphone back on.
    var e = '';
    startAudioButton(true);

    g_speaking = false;
    return;
  }

  // Remove text after the last space.
  if (truncated)  {
    console.log("speakChunk: truncating " + nextChunk);
    nextChunk = nextChunk.replace(/ [^ ]*$/, '');
    console.log("speakChunk: truncated to  " + nextChunk);
  }

  // Remove from buffer.
  g_speechBuffer = g_speechBuffer.replace(nextChunk, '');

  console.log ("speakChunk: nextChunk=" + nextChunk);
  console.log("speakChunk: g_speechBuffer=" + g_speechBuffer);

  g_speaking = true;
  textToSpeech(nextChunk);
}

function textToSpeech(txt) {
  var fromLang = select_dialect.value.replace(/-.*/, '').replace("cmn", "zh");
  var toLang = (fromLang == 'en') ? 'fr' : 'en';

  console.log("textToSpeech: " + txt);


  play_sound("http://translate.google.com/translate_tts?ie=UTF-8&q=" + encodeURIComponent(txt) + "&tl=" + voiceLang
  // + "&total=1"
  // + "&idx=0"
  );
}

var g_speech = '';

function speak() {
  // Get current translation from the div.
  var txt = $("#targetResultsContainer").text();
  
  // Remove what has already been spoken.
  txt = txt.replace(g_speech, '');
  
  // Store current transcript for next time.
  g_speech = $("#targetResultsContainer").text();

  txt = txt.trim();
  
  if (g_speakerOn) {
     // Shut off microphone.
     var e = '';
     startAudioButton(false);

     // Start speaking chunks of text.
     g_speechBuffer += txt;
     console.log ("speak: g_speaking= " + g_speaking);
	 console.log("speak: g_speech=" + g_speech);
	 
	 // Don't interrupt yourself.
     if (!g_speaking) 
	   speakChunk();
  }
}

// var g_chunks = new Object;

function findNamedEntities(txt, completePhrase) {
  if (!completePhrase) return;
  txt = txt.trim();
  if (txt == '') return;
//  if (g_chunks.hasOwnProperty(txt)) {
//    return;
//  }
//  g_chunks[txt] = 1;

  // Add a period after each pause.
  txt += ". ";
  txt = txt.charAt(0).toUpperCase() + txt.slice(1);
  

  console.log("findNamedEntities (really, translate): " + txt);

  // Display source text in log area below.
  Source_log.innerHTML += " " + txt;

//  translate(txt, "RBMT");
//  translate(txt, "G");
  translate(txt, "B");
}



function getToken() {
  var requestStr = "token.php";

  $.ajax({
    url: requestStr,
    type: "GET",
    cache: true,
    dataType: 'json',
    success: function (data) {
      g_token = data.access_token;
    }
  });
}

function translate(txt, engine) {
  if (engine != 'B')
    return;
	
  if (sourceLanguage() == targetLanguage()) {
    displayTranslatedText(txt, engine);
    return;
  }
  
  transFromTo(txt, engine, sourceLanguage(), targetLanguage(), 'ajaxTranslateCallback'); 
}

function backTranslate(txt, engine) {
  if (sourceLanguage() == targetLanguage()) {
    displayTranslatedText(txt, engine);
    return;
  }
  
  transFromTo(txt, engine, targetLanguage(), sourceLanguage(), 'ajaxBackTranslateCallback'); 
}

function transFromTo(txt, engine, from, to, callback) {
  var p = new Object;
  p.text = txt;
  p.from = from;
  p.to = to;
  p.oncomplete = callback;  // <-- a major puzzle solved.  Who would have guessed you specify the jsonp callback in oncomplete?
  p.appId = "Bearer " + g_token; // <-- another major puzzle.  The authentication is supplied in the deprecated appId param.

  var requestStr = "https://api.microsofttranslator.com/V2/Ajax.svc/Translate";

  $.ajax({
    url: requestStr,
    type: "GET",
    data: p,
    dataType: 'jsonp',
    cache: true
  });
}

function ajaxTranslateCallback(response) {
  displayTranslatedText(response, "Bing", targetLanguage());
  backTranslate(response, "Backtrans");
}

function ajaxBackTranslateCallback(response) {
  displayTranslatedText(response, "Backtrans", sourceLanguage());
}



