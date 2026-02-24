import { inject } from '@angular/core';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { signalStoreFeature, withProps } from '@ngrx/signals';
import { Client } from '../../types/client.interface';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export function getClients() {
  return signalStoreFeature(

    withProps(() => {
      const firestore = inject(Firestore);

      return {
        getClientsResource: rxResource<Client[], void>({
          stream: () => {
            const ref = collection(firestore, 'clients');
            return collectionData(ref).pipe(
              map(data => data as Client[])
            );
          },
        }),
      };
    })

  );
}
