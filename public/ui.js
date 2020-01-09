const $ = require("jquery");

const config = require("../config.json");

const { crates, startMap } = config;

module.exports = class UIController {
    constructor({ onGameStart, onNextMap }) {
        this.state = 0;
        this.ui = $("#ui");
        this.onGameStart = onGameStart;
        this.onNextMap = onNextMap;

        $("#start-game").click(e => {
            this.select("loadout");
        });

        $("#start-game-loadout").click(e => {
            this.hide();

            this.onGameStart();
        });

        $("#next-map").click(e => {
            //this.onNextMap();
            this.onGameStart();
            //this.hide();
        });
    }

    async runFinishSequence(gameState) {
        let $win = $("#win");
        let $calcs = $($win.find("#calcs"));
        $calcs.empty();
        let calcs = {};

        let spent = 0;
        let reward = 0;
        for (let crate of gameState.crates) {
            if (!calcs[crate.label])
                calcs[crate.label] = {
                    crate,
                    cost: crate.price,
                    reward: crate.reward,
                    count: 1
                }
            else {
                calcs[crate.label].cost += crate.price;
                calcs[crate.label].reward += crate.reward;
                calcs[crate.label].count++;
            }

            spent += crate.price;
            reward += crate.reward;
        }

        gameState.money += reward;

        function fadeInPromise($el) {
            return new Promise((res, err) => {
                $el.hide();
                $el.fadeIn(() => {
                    res($el);
                });
            });
        }

        async function fadeInEl(elStr) {
            let $new = $(elStr);

            $calcs.append($new);
            await fadeInPromise($new);
        }

        let timeBonus = gameState.crates.length * 10 * (gameState.time / 1000);
        gameState.money += timeBonus;
        if (timeBonus > 0) {
            await fadeInEl("<div class=\"calc-row\">Time bonus: <span class=\"good\"># of crates * 10 * time left = £" + timeBonus.toFixed(2) + "</span>" +
                          "</div>");

            await fadeInEl("<div class=\"divider\"></div>");
        }

        for (let calc of Object.keys(calcs)) {
            let calcObj = calcs[calc];
            let total = calcObj.reward - calcObj.cost;

            fadeInEl("<div class=\"calc-row\">" +
                          calc + " crates: <span class=\"bad\">-£" + calcObj.cost + "</span> + <span class=\"good\">£" + calcObj.crate.reward + " * " + calcObj.count + "</span> = <span class=\"" + (total < 0 ? "bad" : "good") + "\">£" +  total + "</span>" +
                          "</div>");
        }

        if (gameState.crates.length > 0) {
            await fadeInEl("<div class=\"divider\"></div>");
        }

        await fadeInEl("<div class=\"calc-row\">Spent: <span class=\"bad\">£" + spent + "</span>" +
                      "</div>");

        await fadeInEl("<div class=\"calc-row\">Earned: <span class=\"good\">£" + reward + "</span>" +
                      "</div>");

        await fadeInEl("<div class=\"divider\"></div>");

        let total = reward - spent;

        await fadeInEl("<div class=\"calc-row\">Total: <span class=\"" + (total < 0 ? "bad" : "good") + "\">£" + (total + timeBonus).toFixed(2) + "</span>" +
                      "</div>");
    }

    crateSelector(state, onAddCrate) {
        function updateCrateStates() {
            for (var crate of crates) {
                if (state.money < crate.price)
                    $("div[name='" + crate.name + "']").unbind('mouseenter mouseleave click').addClass("disabled");
            }
        }

        $("#crates").empty();

        for (var crate of crates) {
            var $crate = $('<div class="crate" name="' + crate.name + '">' +
                                '<img src="assets/world/crates/' + crate.path + '" />' +
                                '<div class="price">- £' + crate.price + '</div>' +
                                '<div class="reward">+ £' + crate.reward + '</div>' +
                                '</div>');

            $crate.hover((crate => e => {
                $(".crate-placement.active").append('<img src="assets/world/crates/' + crate.path + '" />');

                this.updateId("desc", crate.description || "");
            })(crate), function () {
                $(".crate-placement.active").empty();
            });

            $crate.click((crate => e => {
                $(".crate-placement.active").removeClass("active");
                if (state.crates.length >= 4)
                    return null;

                state.crates.push(crate);

                state.money -= crate.price;

                if (state.money < 0) {
                    state.money = 0;
                } else if (state.money >= crate.price && state.crates.length <= 4) {
                    $("#placements").append('<div class="crate-placement pos-' + state.crates.length + ' active"><img src="assets/world/crates/' + crate.path + '" /></div>');
                }

                updateCrateStates();
                this.updateId("money", "£" + state.money);
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
