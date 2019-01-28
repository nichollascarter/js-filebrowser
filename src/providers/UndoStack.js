class UndoItem {
    constructor(perform, data) {
        this.perform = perform;
        this.data = data;
    }
}

export default class UndoStack {
    constructor(self) {
        this.stack = [];
        this.current = -1;
        this.self = self;
        this.stackSize = 20;
    }
    
    push(perform, data) {
        if (this.stack.length < this.stackSize) {
            this.current++;    
        } else {
            this.stack.shift();
        }
        this.stackEnd = false;
        this.stack.push(new UndoItem(perform, data)); 
    }
    undo() {
        this.current = this.current >= 0 ? --this.current : this.current;
        if (this.current === -1) {
            this.stackBegin = true;
            return null;
        } 

        const item = this.stack[this.current];
        item.perform.call(this.self, false, item.data);
        return item.data;
    }
    redo() {
        if (this.current === this.stack.length - 1) {
            return null;
        }
        if (this.current === -1) {
            this.current++;
        }
        this.current = this.current < this.stack.length - 1 ? ++this.current : this.current;
        const item = this.stack[this.current];
        item.perform.call(this.self, true, item.data);
        return item.data;
    }
    invalidateAll() {
        this.stack = [];
        this.current = -1;
    }
}