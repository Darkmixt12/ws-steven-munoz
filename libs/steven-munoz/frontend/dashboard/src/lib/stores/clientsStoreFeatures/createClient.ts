import { inject } from "@angular/core";
import { addDoc, collection, doc, Firestore } from "@angular/fire/firestore";
import { signalStoreFeature, withMethods, withProps } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { CreateClient } from "../../types/client.interface";
import { from, map, pipe } from "rxjs";

export function createClient() {
    return signalStoreFeature(

        withProps(() => ({
            firestore : inject(Firestore)
        })),

        withMethods((store) => ({

            createClient: rxMethod<CreateClient>(
                pipe(
                    map((client) =>
                    from( (async () => {
                        const scrumRef = collection(store.firestore, 'clients')
                        return addDoc(scrumRef, client)
                    })() )
                )
                )
            )
        }))


    )
}