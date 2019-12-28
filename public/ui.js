const $ = require("jquery");

module.exports = class UIController {
    constructor(onGameStart) {
        this.state = 0;
        this.ui = $("#ui");
        this.onGameStart = onGameStart;

        this.select("main-menu");

        $("#start-game").click(e => {
            this.select("loadout");
        });

        $("#start-game-loadout").click(e => {
            this.hide();

            this.onGameStart();
        });
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
    }
}
