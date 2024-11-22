window.addEventListener("load", () => {
    const inputElement = document.getElementById("input");
    const outputElement = document.getElementById("output");

    inputElement.addEventListener("input", () => {
        const input = inputElement.value.replaceAll(" ", "");

        // parse input
        const regex1 = /((?:co-?)?)(NP|P)(\(?)/gi;
        const regex2 = /((?:co-?)?)(Σ|Π|Δ)(\d*)/gi;
        const regex3 = /\)*/g;

        const classes = [];

        let index = 0;
        let braceOpenCount = 0;

        while (true) {
            regex1.lastIndex = index;
            regex2.lastIndex = index;

            const match1 = regex1.exec(input);
            const match2 = regex2.exec(input);

            if (match1 !== null && match1.index === index) {
                index = regex1.lastIndex;

                const isNegated = match1[1] !== "";
                const hierarchyClass = match1[2];
                const hasBrace = match1[3] !== "";

                if (hierarchyClass === "P") {
                    classes.push(new P());
                } else {
                    if (isNegated) {
                        classes.push(new CoNP());
                    } else {
                        classes.push(new NP());
                    }
                }

                if (hasBrace) {
                    braceOpenCount++;
                } else {
                    break;
                }
            } else if (match2 !== null && match2.index === index) {
                index = regex2.lastIndex;

                const isNegated = match2[1] !== "";
                let hierarchyClass = match2[2];
                const hierarchyOrdinal = parseInt(match2[3] || "1");

                if (isNegated) {
                    if (hierarchyClass === "Σ") {
                        hierarchyClass = "Π";
                    } else if (hierarchyClass === "Π") {
                        hierarchyClass = "Σ";
                    }
                }

                if (hierarchyOrdinal === 0) {
                    classes.push(new P());
                    break;
                }

                if (hierarchyClass === "Σ") {
                    classes.push(new NP());
                } else if (hierarchyClass === "Π") {
                    classes.push(new CoNP());
                } else {
                    classes.push(new P());
                }

                for (let i = 0; i < hierarchyOrdinal - 1; i++) {
                    classes.push(new NP());
                }

                if (hierarchyClass === "Σ") {
                    classes.push(new P());
                } else if (hierarchyClass === "Π") {
                    classes.push(new P());
                }

                break;
            } else {
                outputElement.innerText = "invalid input (unexpected characters found)";
                return;
            }
        }

        // validate braces
        regex3.lastIndex = index;
        const match3 = regex3.exec(input);
        if (match3 === null || regex3.lastIndex !== input.length) {
            outputElement.innerText = "invalid input (unexpected characters found)";
            return;
        }
        const braceCloseCount = match3[0].length;

        if (braceOpenCount !== braceCloseCount) {
            outputElement.innerText = "invalid input (parenthesis don't match)";
            return;
        }

        // create chain
        for (let i = 0; i < classes.length - 1; i++) {
            classes[i].inner = classes[i + 1];
        }

        // compute result
        let explicitResult = classes[0].getResultString();
        classes[0].simplify();
        let simplifiedResult = classes[0].getResultString();

        let hierarchyClass;
        let hierarchyOrdinal = 0;
        if (classes[0] instanceof P) {
            hierarchyClass = "Δ";
            hierarchyOrdinal = 1;
        } else if (classes[0] instanceof NP) {
            hierarchyClass = "Σ";
        } else if (classes[0] instanceof CoNP) {
            hierarchyClass = "Π";
        }
        hierarchyOrdinal += classes[0].countNPInstances();
        outputElement.innerText = `${hierarchyClass}${hierarchyOrdinal}\n= ${explicitResult}\n= ${simplifiedResult}`
    });
});

class P {
    constructor() {
        this.inner = null;
    }

    simplify() {
        while (this.inner instanceof P) {
            this.inner = this.inner.inner;
        }

        if (this.inner === null) {
            return;
        }

        if (this.inner instanceof CoNP) {
            let newInner = new NP();
            newInner.inner = this.inner.inner;
            this.inner = newInner;
        }
        this.inner.simplify();
    }

    getResultString() {
        if (this.inner === null) {
            return "P";
        }
        return `P(${this.inner.getResultString()})`;
    }

    countNPInstances() {
        return this.inner?.countNPInstances() ?? 0;
    }
}

class NP {
    constructor() {
        this.inner = null;
    }

    simplify() {
        while (this.inner instanceof P) {
            this.inner = this.inner.inner;
        }

        if (this.inner === null) {
            return;
        }

        if (this.inner instanceof CoNP) {
            let newInner = new NP();
            newInner.inner = this.inner.inner;
            this.inner = newInner;
        }
        this.inner.simplify();
    }

    getResultString() {
        if (this.inner === null) {
            return "NP";
        }
        return `NP(${this.inner.getResultString()})`;
    }

    countNPInstances() {
        return 1 + (this.inner?.countNPInstances() ?? 0);
    }
}

class CoNP {
    constructor() {
        this.inner = null;
    }

    simplify() {
        while (this.inner instanceof P) {
            this.inner = this.inner.inner;
        }

        if (this.inner === null) {
            return;
        }

        if (this.inner instanceof CoNP) {
            let newInner = new NP();
            newInner.inner = this.inner.inner;
            this.inner = newInner;
        }
        this.inner.simplify();
    }

    getResultString() {
        if (this.inner === null) {
            return "co-NP";
        }
        return `co-NP(${this.inner.getResultString()})`;
    }

    countNPInstances() {
        return 1 + (this.inner?.countNPInstances() ?? 0);
    }
}
