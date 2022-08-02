
export interface IdObject<K, V> {
    id: K,
    data: V,
}

export class IdObjectHolder<T> {
    private currentId: number = 0;
    private objMap: Map<number, IdObject<number, T>> = new Map();
    private idMap: Map<T, number> = new Map();


    fill(args: T[]) {
        for (const it of args) {
            this.add(it);
        }
    }

    nextId(): number {
        return this.currentId++;
    }

    add(data: T) {
        const id = this.nextId();
        this.objMap.set(id, {
            id,
            data,
        });
    }

    remove(toRemove: number | T) {
        if (typeof toRemove === 'number') {
            const entry = this.objMap.get(toRemove);
            this.objMap.delete(toRemove);
            if(entry?.data) {
                this.idMap.delete(entry?.data);
                return entry;
            }
        } else {
            const id = this.idMap.get(toRemove);
            if(typeof id !== 'undefined') {
                this.idMap.delete(toRemove);
                const entry = this.objMap.get(id);
                this.objMap.delete(id);
                return entry;
            }

        }

        return {};
    }

    entries() {
        return this.objMap.values();
    }

}

