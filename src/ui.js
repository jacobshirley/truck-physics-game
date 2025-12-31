const $ = require("jquery");

const config = require("../config.json");

const { crates } = config;

const MAX_CRATES = 6;

function fadeInPromise($el) {
    return new Promise((res, err) => {
        $el.hide();
        $el.fadeIn(() => {
            res($el);
        });
    });
}

async function fadeInEl(elStr, parent) {
    let $new = $(elStr);

    parent.append($new);
    await fadeInPromise($new);
}

module.exports = class UIController {
    constructor({ onGameStart, onNextMap, onTerminate, onRestart, onFinish }) {
        this.state = 0;
        this.ui = $("#ui");
        this.onGameStart = onGameStart;
        this.onNextMap = onNextMap;
        this.onTerminate = onTerminate;
        this.onRestart = onRestart;
        this.onFinish = onFinish;

        $("#start-game").click(e => {
            this.select("loadout");
        });

        $("#start-game-loadout").click(e => {
            this.hide();

            this.onGameStart();
        });

        $("#next-map").click(e => {
            this.onNextMap();
        });

        $("#end-level").click(e => {
            this.onTerminate();
        });

        $("#restart-game").click(e => {
            this.onRestart();
        });
    }

    async runHighscoresSequence(gameState) {
        let $list = $("#highscores #list");

        $("#highscores #score").text("£" + gameState.money.toFixed(2));

        let highscores = JSON.parse(document.cookie || "[]");
        highscores.push(gameState.money);
        highscores = highscores.sort((a, b) => b - a);
        if (highscores.length > config.maxHighscores)
            highscores.pop();

        for (var i = 0; i < highscores.length; i++) {
            await fadeInEl("<div>" + (i + 1) + ". £" + highscores[i].toFixed(2) + "</div>", $list);
        }

        document.cookie = JSON.stringify(highscores);
    }

    async runFinishSequence(gameState) {
        let $finish = $("#finish");
        let $calcs = $($finish.find("#calcs"));
        $calcs.empty();
        let calcs = {};

        let spent = 0;
        let reward = 0;

        let $next = $("#next-map");
        if (gameState.maps.length == 0) {
            $next.text("Highscores");
            $next.unbind("click").click(e => {
                this.onFinish();
            });
        } else {
            $next.text("Next level");
            $next.click(e => {
                this.onNextMap();
            });
        }

        for (let crate of gameState.selectedCrates) {
            if (!calcs[crate.label]) {
                let cratesLeft = gameState.crates.filter(x => x.name == crate.name);

                calcs[crate.label] = {
                    crate,
                    cost: crate.price,
                    reward: crate.reward * cratesLeft.length,
                    count: 1,
                    endCount: cratesLeft.length
                }

                reward += crate.reward * cratesLeft.length;
            } else {
                calcs[crate.label].cost += crate.price;
                calcs[crate.label].count++;
            }

            spent += crate.price;
        }

        let timeBonus = gameState.crates.length * 10 * (gameState.time / 1000);

        gameState.money += reward;
        gameState.money += timeBonus;

        if (timeBonus > 0) {
            await fadeInEl("<div class=\"calc-row\">Time bonus: <span class=\"good\"># of crates * 10 * time left = £" + timeBonus.toFixed(2) + "</span>" + "</div>", $calcs);

            await fadeInEl("<div class=\"divider\"></div>", $calcs);
        }

        for (let calc of Object.keys(calcs)) {
            let calcObj = calcs[calc];
            let total = calcObj.reward - calcObj.cost;

            fadeInEl("<div class=\"calc-row\">" +
                          calc + " crates: <span class=\"bad\">-£" + calcObj.cost + "</span> + <span class=\"good\">£" + calcObj.crate.reward + " * " + calcObj.endCount + "</span> = <span class=\"" + (total < 0 ? "bad" : "good") + "\">£" +  total + "</span>" +
                          "</div>", $calcs);
        }

        if (gameState.selectedCrates.length > 0) {
            await fadeInEl("<div class=\"divider\"></div>", $calcs);
        }

        await fadeInEl("<div class=\"calc-row\">Spent: <span class=\"bad\">£" + spent + "</span>" +
                      "</div>", $calcs);

        await fadeInEl("<div class=\"calc-row\">Earned: <span class=\"good\">£" + reward + "</span>" +
                      "</div>", $calcs);

        await fadeInEl("<div class=\"divider\"></div>", $calcs);

        let total = reward - spent;

        await fadeInEl("<div class=\"calc-row\">Total: <span class=\"" + (total < 0 ? "bad" : "good") + "\">£" + (total + timeBonus).toFixed(2) + "</span>" +
                      "</div>", $calcs);
    }

    crateSelector(state, onAddCrate) {
        function updateCrateStates() {
            for (var crate of crates) {
                if (state.money < crate.price)
                    $("div[name='" + crate.name + "']").unbind('mouseenter mouseleave click').addClass("disabled");
            }
        }

        this.updateId("money", "£" + state.money.toFixed(2));

        state.crates = [];
        $("#crates").empty();
        $("#placements").empty();

        //$("#start-game-loadout").attr("disabled", true);

        $("#placements").append('<div class="crate-placement pos-1 active"></div>');

        for (var crate of crates) {
            var $crate = $('<div class="crate" name="' + crate.name + '">' +
                                '<img src="' + config.crateDir + crate.path + '" />' +
                                '<div class="price">- £' + crate.price + '</div>' +
                                '<div class="reward">+ £' + crate.reward + '</div>' +
                                '</div>');

            $crate.on('mouseenter', (crate => e => {
                $(".crate-placement.active").append('<img src="' + config.crateDir + crate.path + '" />');
            })(crate)).on('mouseleave', function () {
                $(".crate-placement.active").empty();
            });

            $crate.on('click', (crate => e => {
                $("#start-game-loadout").attr("disabled", false);
                $(".crate-placement.active").removeClass("active");
                if (state.crates.length >= MAX_CRATES)
                    return null;

                state.crates.push(crate);

                state.money -= crate.price;

                if (state.money < 0) {
                    state.money = 0;
                } else if (state.money >= crate.price && state.crates.length < MAX_CRATES) {
                    $("#placements").append('<div class="crate-placement pos-' + (state.crates.length + 1) + ' active"><img src="' + config.crateDir +  crate.path + '" /></div>');
                }

                updateCrateStates();
                this.updateId("money", "£" + state.money.toFixed(2));
            })(crate));

            $("#crates").append($crate);
        }
    }

    updateId(id, val) {
        $("#" + id).text(val);
    }

    hide() {
        this.ui.hide();
    }

    show() {
        this.ui.show();
    }

    select(screen) {
        this.ui.children().hide();
        $(this.ui.find("#" + screen)).show();
        this.show();
    }
}
