const state = require("./state");
const gm = require("gm").subClass({ imageMagick: true });
const spawn = require("child_process").spawn;
const path = require("path");
const rootPath = path.resolve(__dirname, "..");
const fromRoot = (relPath) => path.resolve(rootPath, relPath);
const os = require("os");

async function robot() {
  const content = state.load();

  //await convertAllImages(content);
  //await createAllSentenceImages(content);
  await createYouTubeThumbnail(content);
  await createAfterEffectsScript(content);
  //await renderVideoWithAfterEffects();

  state.save(content);

  async function convertAllImages(content) {
    for (
      let sentenceIndex = 0;
      sentenceIndex < content.sentences.length;
      sentenceIndex++
    ) {
      await convertImage(sentenceIndex);
    }
  }

  async function convertImage(sentenceIndex) {
    return new Promise((resolve, reject) => {
      const inputFile = fromRoot(`./content/${sentenceIndex}-original.png[0]`);
      const outputFile = fromRoot(`./content/${sentenceIndex}-converted.png`);
      const width = 1920;
      const height = 1080;

      console.log(inputFile);

      gm()
        .command("magick")
        .in(inputFile)
        .out("(")
        .out("-clone")
        .out("0")
        .out("-background", "white")
        .out("-blur", "0x9")
        .out("-resize", `${width}x${height}^`)
        .out(")")
        .out("(")
        .out("-clone")
        .out("0")
        .out("-background", "white")
        .out("-resize", `${width}x${height}`)
        .out(")")
        .out("-delete", "0")
        .out("-gravity", "center")
        .out("-compose", "over")
        .out("-composite")
        .out("-extent", `${width}x${height}`)
        .write(outputFile, (error) => {
          if (error) {
            return reject(error);
          }

          console.log(`> [Video-robot] Image converted: ${outputFile}`);
          resolve();
        });
    });
  }

  async function createAllSentenceImages(content) {
    for (
      let sentenceIndex = 0;
      sentenceIndex < content.sentences.length;
      sentenceIndex++
    ) {
      await createSentenceImage(
        sentenceIndex,
        content.sentences[sentenceIndex].text
      );
    }
  }

  async function createSentenceImage(sentenceIndex, sentenceText) {
    return new Promise((resolve, reject) => {
      const outputFile = fromRoot(`./content/${sentenceIndex}-sentence.png`);

      const templateSettings = {
        0: {
          size: "1920x400",
          gravity: "center",
        },
        1: {
          size: "1920x1080",
          gravity: "center",
        },
        2: {
          size: "800x1080",
          gravity: "west",
        },
        3: {
          size: "1920x400",
          gravity: "center",
        },
        4: {
          size: "1920x1080",
          gravity: "center",
        },
        5: {
          size: "800x1080",
          gravity: "west",
        },
        6: {
          size: "1920x400",
          gravity: "center",
        },
      };

      gm()
        .command("magick")
        .out("-size", templateSettings[sentenceIndex].size)
        .out("-gravity", templateSettings[sentenceIndex].gravity)
        .out("-background", "transparent")
        .out("-fill", "white")
        .out("-kerning", "-1")
        .out(`caption:${sentenceText}`)
        .write(outputFile, (error) => {
          if (error) {
            return reject(error);
          }

          console.log(`> [Video-robot] Sentence created: ${outputFile}`);
          resolve();
        });
    });
  }

  async function createYouTubeThumbnail(content) {
    return new Promise((resolve, reject) => {
      const query = `${content.prefix}\n${content.searchTerm}`;
      gm()
        .command("magick")
        .in(fromRoot("./content/0-converted.png"))
        .font("COMICBD.ttf", 210)
        .fill("#fff")
        .stroke("#000", 1)
        .drawText(0, 320, query, "center")
        .write(fromRoot("./content/youtube-thumbnail.jpg"), (error) => {
          if (error) {
            return reject(error);
          }

          console.log("> Creating YouTube Thumbnail");
          resolve();
        });
    });
  }

  async function createAfterEffectsScript(content) {
    await state.saveScript(content);
  }

  async function renderVideoWithAfterEffects() {
    return new Promise((resolve, reject) => {
      const aerenderFilePath =
        "C:/Program Files/Adobe/Adobe After Effects 2020/Support Files/aerender.exe";

      const templateFilePath = fromRoot("./templates/1/template.aep");
      const destinationFilePath = fromRoot("./content/output.mov");

      console.log("> [video-robot] Starting After Effects");

      const aerender = spawn(aerenderFilePath, [
        "-comp",
        "main",
        "-project",
        templateFilePath,
        "-output",
        destinationFilePath,
      ]);

      aerender.stdout.on("data", (data) => {
        process.stdout.write(data);
      });

      aerender.on("close", () => {
        console.log("> [video-robot] After Effects closed");
        resolve();
      });
    });
  }
}

module.exports = robot;
