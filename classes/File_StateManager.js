const {Base_StateManager} = require('./abstract/Base_StateManager');
const fs = require('fs');

class File_StateManager extends Base_StateManager{

    constructor(){
        super();
        this.pos = 0; //hard coded start pos... TODO: add resume function and write pos to file
        this.fileStreams = [];
        this.overwrite_on_restart = true; // true: delete existing file(s); false: append to existing file(s)

    }

    update( c, x){ this.pos +=x; }

    getState(){ return this.pos; }

    write(filename, append_content){
        //check if a stream already exist for filename
        let fstream = this.fileStreams.find(s => s.filename == filename);
        if(fstream){
            fstream = fstream.stream;
        }
        else{
            if(this.overwrite_on_restart && fs.existsSync(filename) ){
                fs.unlinkSync(filename);
            }
            console.log(`Create reusable stream for file "${filename}"`);
            fstream = fs.createWriteStream(filename, {flags:'a'});
            this.fileStreams.push({filename: filename, stream: fstream });
        }

        fstream.write(append_content + "\n");
    }
}

module.exports = {
    File_StateManager
};
