/*=================================
BIBLE UNDERCOVER
Version 2.0
=================================*/

let holdInterval = null;
let holdProgress = 0;
let wordViewed = false;
let usedPairs = [];
let selectedPair = [];
let playerWords = [];

const game = {
    players: [],
    votes: [],
    settings: {
        playerCount: 4,
        imposterCount: 1,
        discussionTime: 60,
        difficulty: "Medium",
        category: "Mixed"
    },
    currentPlayer: 0,
    imposters: [],
    round: 1,
    playerWins: 0,
    imposterWins: 0
};

/*=================================
SCREENS
=================================*/

const screens = {
    splash: document.getElementById("splashScreen"),
    settings: document.getElementById("settingsScreen"),
    players: document.getElementById("playersScreen"),
    pass: document.getElementById("passScreen"),
    reveal: document.getElementById("revealScreen"),
    discussion: document.getElementById("discussionScreen"),
    vote: document.getElementById("voteScreen"),
    result: document.getElementById("resultScreen")
};

function showScreen(name) {
    if (!screens[name]) return;

    Object.values(screens).forEach(screen => screen.classList.remove("active"));
    screens[name].classList.add("active");
}

/*=================================
BUTTONS
=================================*/

const playBtn = document.getElementById("playBtn");
const continueBtn = document.getElementById("continueBtn");
const startGameBtn = document.getElementById("startGameBtn");
const readyBtn = document.getElementById("readyBtn");
const nextPlayerBtn = document.getElementById("nextPlayerBtn");
const startDiscussionBtn = document.getElementById("startDiscussionBtn");
const endGameBtn = document.getElementById("endGameBtn");
const finishVotingBtn = document.getElementById("finishVotingBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

/*=================================
NAVIGATION
=================================*/

playBtn.onclick = () => {
    showScreen("settings");
};

continueBtn.onclick = loadPlayerInputs;

playAgainBtn.onclick = () => {
    location.reload();
};

endGameBtn.onclick = returnToMenu;

function returnToMenu() {
    stopDiscussionTimer();
    resetDiscussion();
    clearInterval(holdInterval);
    holdInterval = null;
    holdProgress = 0;
    wordViewed = false;
    selectedPair = [];
    playerWords = [];
    usedPairs = [];
    currentVoter = 0;

    game.players = [];
    game.votes = [];
    game.imposters = [];
    game.currentPlayer = 0;
    game.round = 1;
    game.playerWins = 0;
    game.imposterWins = 0;

    document.getElementById("voteList").innerHTML = "";
    document.getElementById("resultDetails").innerHTML = "";
    document.getElementById("playersScore").innerText = "0";
    document.getElementById("imposterScore").innerText = "0";
    document.getElementById("progressFill").style.width = "0%";
    document.getElementById("overallProgressFill").style.width = "0%";
    document.getElementById("viewedBadge").classList.add("hidden");
    nextPlayerBtn.style.display = "none";
    revealCard.classList.remove("flipped");

    showScreen("splash");
}

/*=================================
SETTINGS
=================================*/

function loadPlayerInputs() {

    game.settings.playerCount = clampNumber(
        parseInt(document.getElementById("playerCount").value, 10),
        3,
        20,
        4
    );

    game.settings.imposterCount = clampNumber(
        parseInt(document.getElementById("imposterCount").value, 10),
        1,
        game.settings.playerCount - 1,
        1
    );

    game.settings.discussionTime = clampNumber(
        parseInt(document.getElementById("discussionTime").value, 10),
        30,
        120,
        60
    );

    game.settings.difficulty = document.getElementById("difficulty").value;

    game.settings.category = document.getElementById("category").value;

    const container = document.getElementById("playerInputs");

    container.innerHTML = "";

    for (let i = 1; i <= game.settings.playerCount; i++) {

        const input = document.createElement("input");

        input.type = "text";

        input.className = "playerInput";

        input.placeholder = "Player " + i;

        container.appendChild(input);

    }

    showScreen("players");

}

function clampNumber(value, min, max, fallback) {
    if (!Number.isFinite(value)) return fallback;

    return Math.min(Math.max(value, min), max);
}

/*=================================
START GAME
=================================*/

startGameBtn.onclick = () => {

    const inputs = document.querySelectorAll(".playerInput");

    game.players = [];

    inputs.forEach((input, index) => {

        let name = input.value.trim();

        if (name === "") {

            name = "Player " + (index + 1);

        }

        game.players.push(name);

    });

    game.currentPlayer = 0;

    prepareRound();

};

/*=================================
PREPARE ROUND
=================================*/

function prepareRound() {

    if (game.currentPlayer === 0) {

        setupWords();

    }

    document.getElementById("passPlayerName").innerText =
        game.players[game.currentPlayer];

    showScreen("pass");

}

/*=================================
WORD ASSIGNMENT
=================================*/

function setupWords() {

    const category = wordDatabase[game.settings.category] ?
        game.settings.category :
        "Mixed";
    const difficulty = game.settings.difficulty;

    const list = wordDatabase[category][difficulty] || wordDatabase.Mixed.Medium;

    if (usedPairs.length >= list.length) {

        usedPairs = [];

    }

    let random;

    do {

        random = Math.floor(Math.random() * list.length);

    } while (usedPairs.includes(random));

    usedPairs.push(random);

    selectedPair = [...list[random]];

    playerWords = [];

    for (let i = 0; i < game.players.length; i++) {

        playerWords.push(selectedPair[0]);

    }

    game.imposters = [];

    while (game.imposters.length < game.settings.imposterCount) {

        const r = Math.floor(Math.random() * game.players.length);

        if (!game.imposters.includes(r)) {

            game.imposters.push(r);

            playerWords[r] = selectedPair[1];

        }

    }

}

/*=================================
READY
=================================*/

readyBtn.onclick = () => {
    wordViewed = false;
    holdProgress = 0;
    clearInterval(holdInterval);
    holdInterval = null;

    revealCard.classList.remove("flipped");
    document.getElementById("progressFill").style.width = "0%";
    document.getElementById("viewedBadge").classList.add("hidden");
    document.getElementById("nextPlayerBtn").style.display = "none";
    document.getElementById("secretWord").innerText = playerWords[game.currentPlayer];

    updateProgress();

    showScreen("reveal");
};

/*=================================
NEXT PLAYER
=================================*/

nextPlayerBtn.onclick = () => {

    game.currentPlayer++;

    if (game.currentPlayer >= game.players.length) {

        resetDiscussion();
        showScreen("discussion");

        return;

    }

    prepareRound();

};

function updateProgress() {

    const current = game.currentPlayer + 1;

    const total = game.players.length;

    document.getElementById("playerProgressText").innerText =
        `Player ${current} of ${total}`;

    const percent = (current / total) * 100;

    document.getElementById("overallProgressFill").style.width =
        percent + "%";

}

function celebrate() {

    for (let i = 0; i < 120; i++) {

        const piece = document.createElement("div");

        piece.className = "confetti";

        piece.style.left = Math.random() * 100 + "vw";

        piece.style.animationDelay = Math.random() * 2 + "s";

        piece.style.background = `hsl(${Math.random() * 360},90%,60%)`;

        document.body.appendChild(piece);

        setTimeout(() => {

            piece.remove();

        }, 4000);

    }

}

/*=================================
DISCUSSION
=================================*/

let discussionInterval;
let remainingTime = 0;

startDiscussionBtn.onclick = () => {

    if (discussionInterval) {
        endDiscussionAndVote();
        return;
    }

    remainingTime = game.settings.discussionTime;
    startDiscussionBtn.innerText = "End Timer";

    updateTimer();

    discussionInterval = setInterval(() => {

        remainingTime--;

        updateTimer();

        if (remainingTime <= 0) {

            endDiscussionAndVote();

        }

    }, 1000);

};

function endDiscussionAndVote() {
    stopDiscussionTimer();
    showScreen("vote");
    loadVoting();
}

function stopDiscussionTimer() {
    clearInterval(discussionInterval);
    discussionInterval = null;
    startDiscussionBtn.innerText = "Start";
}

function resetDiscussion() {
    stopDiscussionTimer();
    remainingTime = game.settings.discussionTime;
    updateTimer();
}

function updateTimer() {

    let min = Math.floor(remainingTime / 60);

    let sec = remainingTime % 60;

    min = min < 10 ? "0" + min : min;

    sec = sec < 10 ? "0" + sec : sec;

    document.getElementById("timer").innerText = `${min}:${sec}`;

}

/*=================================
VOTING
=================================*/

finishVotingBtn.style.display = "none";

let currentVoter = 0;

function loadVoting() {

    currentVoter = 0;
    game.votes = [];

    showVotingPlayer();

}

function showVotingPlayer() {

    if (currentVoter >= game.players.length) {
        calculateWinner();
        return;
    }

    const title = document.getElementById("voteTitle");
    title.innerText = `${game.players[currentVoter]}, choose the Imposter`;

    const voteList = document.getElementById("voteList");
    voteList.innerHTML = "";

    game.players.forEach((player, index) => {

        if (index === currentVoter) return;

        const card = document.createElement("div");

        card.className = "vote-card";

        card.innerText = player;

        card.onclick = () => {

            game.votes.push({
                voter: currentVoter,
                votedFor: index
            });

            currentVoter++;

            showVotingPlayer();

        };

        voteList.appendChild(card);

    });

}

/*=================================
INITIALIZE
=================================*/

showScreen("splash");

/*=================================
BIBLICAL WORD DATABASE
=================================*/

const wordDatabase = {
    Mixed: {
        Easy: [
            ["Ark", "Noah"],
            ["Red Sea", "Moses"],
            ["Goliath", "David"],
            ["Great Fish", "Jonah"],
            ["Lions", "Daniel"],
            ["Dreams", "Joseph"],
            ["Isaac", "Abraham"],
            ["Jesus", "Mary"],
            ["Keys", "Peter"],
            ["Calvary", "Cross"],
            ["Faith", "Prayer"],
            ["Mercy", "Grace"],
            ["Genesis", "Creation"],
            ["Passover", "Exodus"],
            ["Manger", "Bethlehem"],
            ["Temple", "Jerusalem"],
            ["Pharaoh", "Egypt"],
            ["Garden", "Eden"],
            ["Baptism", "Jordan"],
            ["Holy Spirit", "Pentecost"]
        ],

        Medium: [
            ["Ladder", "Jacob"],
            ["Delilah", "Samson"],
            ["Jericho", "Joshua"],
            ["Fire", "Elijah"],
            ["Mantle", "Elisha"],
            ["Wisdom", "Solomon"],
            ["Wall", "Nehemiah"],
            ["Scroll", "Ezra"],
            ["Boaz", "Ruth"],
            ["Queen", "Esther"],
            ["Letters", "Paul"],
            ["Tax Collector", "Matthew"],
            ["Physician", "Luke"],
            ["Revelation", "John"],
            ["Doubt", "Thomas"],
            ["Resurrection", "Lazarus"],
            ["Carpenter", "Nazareth"],
            ["Exile", "Babylon"],
            ["Commandments", "Sinai"],
            ["Promise", "Covenant"]
        ],

        Hard: [
            ["Walls", "Jericho"],
            ["Sea", "Galilee"],
            ["Revelation", "Patmos"],
            ["Flood", "Ark"],
            ["Scripture", "Scroll"],
            ["Joshua", "Trumpet"],
            ["Bread", "Manna"],
            ["Moses", "Staff"],
            ["Stone", "Sling"],
            ["King", "Crown"],
            ["Light", "Lamp"],
            ["Spirit", "Sword"],
            ["Faith", "Shield"],
            ["Anointing", "Oil"],
            ["Empty Tomb", "Resurrection"],
            ["Cross", "Crucifixion"],
            ["Cloud", "Ascension"],
            ["Ark", "Flood"],
            ["Lamb", "Passover"],
            ["Mountain", "Transfiguration"]
        ]
    }
};

const revealCard = document.getElementById("revealCard");

function beginHold() {

    if (wordViewed) return;

    clearInterval(holdInterval);
    holdProgress = 0;

    document.getElementById("progressFill").style.width = "0%";

    holdInterval = setInterval(() => {

        holdProgress += 2;

        document.getElementById("progressFill").style.width =
            holdProgress + "%";

        if (holdProgress >= 100) {

            clearInterval(holdInterval);
            holdInterval = null;

            showWord();

        }

    }, 20);

}

function cancelHold() {

    clearInterval(holdInterval);
    holdInterval = null;

    if (!wordViewed) {

        holdProgress = 0;

        document.getElementById("progressFill").style.width = "0%";

    }

}

function showWord() {

    wordViewed = true;

    document
        .getElementById("revealCard")
        .classList.add("flipped");

}

function hideWord() {

    clearInterval(holdInterval);
    holdInterval = null;

    if (!wordViewed) {
        cancelHold();
        return;
    }

    document
        .getElementById("revealCard")
        .classList.remove("flipped");

    document
        .getElementById("viewedBadge")
        .classList.remove("hidden");

    document
        .getElementById("nextPlayerBtn")
        .style.display = "block";

}

function endHold() {
    if (wordViewed) {
        hideWord();
        return;
    }

    cancelHold();
}

revealCard.addEventListener("mousedown", beginHold);

revealCard.addEventListener("mouseup", endHold);

revealCard.addEventListener("mouseleave", endHold);

revealCard.addEventListener("touchstart", (e) => {

    e.preventDefault();

    beginHold();

});

revealCard.addEventListener("touchend", (e) => {

    e.preventDefault();

    endHold();

});

revealCard.addEventListener("touchcancel", endHold);

function showResults(votedPlayer) {

    showScreen("result");

    const found = game.imposters.includes(votedPlayer);

    if (found) {

        celebrate();

    }

    const winner = document.getElementById("winnerTitle");

    const details = document.getElementById("resultDetails");

    details.innerHTML = "";

    if (found) {

        winner.innerText = "Players Win";

        game.playerWins++;

    } else {

        winner.innerText = "Imposter Wins";

        game.imposterWins++;

    }

    game.players.forEach((player, index) => {

        const card = document.createElement("div");

        card.className = "result-card";

        const resultPlayer = document.createElement("div");
        const name = document.createElement("span");
        const word = document.createElement("span");

        resultPlayer.className = "result-player";
        name.innerText = player;
        word.innerText = playerWords[index];

        resultPlayer.appendChild(name);
        resultPlayer.appendChild(word);
        card.appendChild(resultPlayer);

        if (game.imposters.includes(index)) {

            card.style.border = "2px solid crimson";

        }

        details.appendChild(card);

    });

    document.getElementById("playersScore").innerText =
        game.playerWins;

    document.getElementById("imposterScore").innerText =
        game.imposterWins;
}

document.getElementById("nextRoundBtn").onclick = () => {

    game.round++;

    game.currentPlayer = 0;

    playerWords = [];

    game.votes = [];
    currentVoter = 0;
    document.getElementById("voteList").innerHTML = "";
    revealCard.classList.remove("flipped");
    resetDiscussion();

    prepareRound();

};

function calculateWinner() {

    const counts = {};

    game.votes.forEach(vote => {

        counts[vote.votedFor] = (counts[vote.votedFor] || 0) + 1;

    });

    let winner = -1;

    let max = -1;
    let tied = false;

    for (const id in counts) {

        if (counts[id] > max) {

            max = counts[id];

            winner = id;
            tied = false;

        } else if (counts[id] === max) {

            tied = true;

        }

    }

    showResults(winner === -1 || tied ? -1 : Number(winner));

}
