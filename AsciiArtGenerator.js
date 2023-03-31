/**
 * 
 */
class AsciiArtGenerator {
    imgSrc;
    fontFamily;
    fontSize;
    lineHeight;
    asciiVariety;

    imgWidth;
    imgHeight;

    // Private?
    imgEl; // TODO: rename inputImg
    // TODO: rename fields
    outputEl;

    constructor() {

    }

    generate() {
        perf();
        this.setupImage();
        this.setupCanvas();
    }

    /**
     * Sets up the image object.
     */
    setupImage = () => {

        this.imgEl = document.querySelector("#Input");
        this.imgEl.style.width = `${this.imgWidth}px`;
        this.imgEl.style.height = `${this.imgHeight}px`;
        this.imgEl.src = this.imgSrc;
    }

    /**
     * Sets up the canvas element (and adds image inside the canvas).
     */
    setupCanvas = () => {

        const imgObj = new Image();
        imgObj.crossOrigin = "Anonymous";
        imgObj.src = this.imgSrc;
        // img.src = "https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png";
        // img.src = "https://i.imgur.com/s4ITte7.jpg";
        // img.src = "https://i.imgur.com/E3M6hNM.png";
        // img.src = "https://i.imgur.com/Bk0nFbr.png";
        imgObj.addEventListener("load", () => {
            
            this.canvas = document.querySelector("#InputCanvas");
            this.canvas.width = this.imgWidth;
            this.canvas.height = this.imgHeight;

            this.context = this.canvas.getContext("2d");
            this.context.drawImage(imgObj, 0, 0);

            try {
                localStorage.setItem("saved-image-example", this.canvas.toDataURL("image/png"));
                this.setupRender();
            }
            catch(e) {
                console.log(e);
            }

        }, false);
    }

    /**
     * Sets up the rendering area.
     */
    setupRender = () => {
        this.render = document.querySelector("#Output");
        this.render.style.width = `${this.imgWidth}px`;
        this.render.style.height = `${this.imgHeight}px`;
        this.render.style.fontFamily = this.fontFamily;
        this.render.style.fontSize = this.fontSize;
        this.render.style.lineHeight = this.lineHeight;
        this.render.style.letterSpacing = this.letterSpacing;
        this.render.style.border = "1px solid lightgrey";

        // Calibrates the rendering area by calculating how many rows and
        // columns are needed to this.render the ASCII art at the right dimensions.
        const result = calibrate(this.imgWidth, this.imgHeight, this.fontFamily, this.fontSize, this.lineHeight, this.letterSpacing),
            char = result.char,
            cols = result.cols,
            rows = result.rows;

        // Gets the whole raw image data.
        const rawImageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;

        /**
         * Contains an organized image data matrix, that is easily readable.
         * Contains rows, which contains columns, which contains RGB data in it.
         * It will be used to quickly access the image data to calculate the average
         * luminance for a square of pixels (ex: each 40px*40px, get average luminance).
         * @var {array}
         * @example If the image is 512px * 300px, it will have 300 rows with 512 columns each.
         * [
         *   [                  // Each entry is a row
         *     [87, 130, 187]   // Each entry is a column in a row, which contains RGB data.
         *     ...
         *   ],
         *   ...
         * ]
         */
        const imageData = [];

        // Inits the matrix.
        for (let x = 0; x < this.canvas.width; x++) {
            imageData[x] = [];
        }

        let index = 0;

        // Fill it with data.
        for (let y = 0; y < this.canvas.height; y++) {
            for (let x = 0; x < this.canvas.width; x++) {
                imageData[x][y] = [rawImageData[index], rawImageData[index + 1], rawImageData[index + 2]];
                index += 4;
            }
        }

        /**
         * Builds the matrix of average luminance value for each group of pixels.
         * @var {array}
         * @example If the image is 500px * 300px, and rows and cols size are 10px, it will have 30 rows with 50 columns each.
         * [
         *   [       // Each entry is a row
         *     70    // Each entry is a column in a row, which contains the average luminance value.
         *     ...
         *   ],
         *   ...
         * ]
         */
        let avgLuminanceMatrix = [];
        
        // Current position in the canvas rectangle.
        let x = 0,
            y = 0;

        // For each cols of the rendering area.
        for (let xi = 0; xi < cols; xi++) {

            let r, // Average RED pixel color of the current rectangle.
                g, // ...     GREEN
                b; // ...     BLUE

            // Inits the matrix row.
            avgLuminanceMatrix[xi] = [];
            
            // For each rows of the rendering area.
            for (let yi = 0; yi < rows; yi++) {

                let rectX = Math.floor(x), // Rectangle's current position.
                    rectY = Math.floor(y),
                    rectR = [], // Array of all RED pixel values from the current rectangle.
                    rectG = [], // ...          GREEN
                    rectB = []; // ...          BLUE

                // For each columns pixels in the current rectangle.
                for (let rectXi = 0; rectXi < char.width; rectXi++) {

                    // For each rows pixels in the current rectangle.
                    for (let rectYi = 0; rectYi < char.height; rectYi++) {
                        rectR.push(imageData[rectX][rectY][0]);
                        rectG.push(imageData[rectX][rectY][1]);
                        rectB.push(imageData[rectX][rectY][2]);
                        rectY++;
                    }

                    rectY = Math.round(y);
                    rectX++;
                }

                // Gets the average color of all pixels on the selected zone (the size of an ASCII char).
                g = Math.round(rectG.reduce((a, v, i) => (a * i + v) / (i + 1)));
                b = Math.round(rectB.reduce((a, v, i) => (a * i + v) / (i + 1)));
                r = Math.round(rectR.reduce((a, v, i) => (a * i + v) / (i + 1)));

                // Adds the average luminance to the matrix.
                avgLuminanceMatrix[xi][yi] = RGBtoHSL(r, g, b)[2];

                y += char.height;
                y = Math.round(y * 100) / 100;
            }
            
            y = 0;
            x += char.width;
            x = Math.round(x * 100) / 100;
        }

        this.renderImage(avgLuminanceMatrix, cols, rows);
    }

    // Method 1
    renderImage = (avgLuminanceMatrix, cols, rows) => {
        // This array was calculated by the `orderASCIIByDarkness` function.
        // let asciiArray = [" ", "@"];
        let asciiArray = [" ", "`", ".", "'", "-", "_", ":", ",", "\"", "^", "~", ";", ">", "<", "!", "=", "*", "\\", "/", "+", "?", "r", "c", "|", "L", ")", "(", "v", "T", "7", "i", "s", "z", "]", "}", "J", "{", "[", "l", "t", "x", "Y", "F", "n", "u", "f", "C", "1", "j", "I", "3", "o", "2", "y", "5", "e", "a", "S", "k", "V", "h", "E", "P", "Z", "w", "K", "4", "U", "X", "9", "6", "p", "q", "b", "d", "m", "A", "H", "G", "R", "#", "O", "D", "%", "8", "W", "M", "N", "B", "$", "0", "g", "Q", "&", "@"];

        // If 100% is given, remove 0%.
        // If 75% is given, remove 25%.
        // If 0% is given, remove 100%.
        const percentageToRemove = 100 - this.asciiVariety;

        // Remove N percentage of ASCII elements, to make the color variety smaller or bigger.
        asciiArray = arrayRemovePercentage(asciiArray, percentageToRemove);

        asciiArray = asciiArray.reverse();

        /**
         * Gets the right ASCII character depending of its luminance.
         */
        const getAsciiCharacterFromLuminance = (luminance) => {
            return asciiArray[Math.round((asciiArray.length - 1) * (luminance / 100))];
        };

        let asciiString = "";

        // Fills up the ASCII string.
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                asciiString += getAsciiCharacterFromLuminance(avgLuminanceMatrix[x][y]);
            }
            asciiString += "\n";
        }

        // Displays the string.
        this.render.innerText = asciiString;

        perf();
        perfLog();
    }

    // Method 2
    // renderImage = (avgLuminanceMatrix, cols, rows) => {
    //     let asciiArray = [
    //             ["&nbsp;"],
    //             ["`", ".", "'", ","],
    //             ["i", "s", "z"],
    //             ["I", "3", "2", "V"],
    //             ["W", "M", "N", "B", "$"]
    //         ];

    //     asciiArray = asciiArray.reverse();

    //     const getAsciiCharacterFromLuminance = (luminance) => {
    //         return asciiArray[Math.round((asciiArray.length - 1) * (luminance / 100))];
    //     };

    //     let asciiString = "";
    //     for (let y = 0; y < rows; y++) {
    //         for (let x = 0; x < cols; x++) {
    //             // console.log(y);
    //             let chosenCharset = getAsciiCharacterFromLuminance(avgLuminanceMatrix[x][y])
    //             asciiString += chosenCharset[randomIntFromInterval(0, chosenCharset.length - 1)];
    //         }
    //         asciiString += "\n";
    //     }

    //     this.render.innerText = asciiString;

    //     perf();
    //     perfLog();
    // }
}
