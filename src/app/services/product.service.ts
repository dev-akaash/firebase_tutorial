import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Plugins } from '@capacitor/core';
const { Storage } = Plugins;
import firebase from 'firebase/app';

const CART_STORAGE_KEY = 'MY_CART';
const INCREMENT = firebase.firestore.FieldValue.increment(1);
const DECREMENT = firebase.firestore.FieldValue.increment(-1);

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  productsCollection: AngularFirestoreCollection;
  cart = new BehaviorSubject({});
  cartKey = null;

  constructor(private afs: AngularFirestore) { 
    this.productsCollection = this.afs.collection('products');
    this.loadCart();
  }

  getProducts() {
    return this.productsCollection.valueChanges({ idField: 'id' });
  }

  async loadCart() {
    const result = await Storage.get({ key: CART_STORAGE_KEY });
    console.log('Cart from storage: ', result);

    if (result.value) {
      this.cartKey = result.value;
      this.afs.collection('carts').doc(this.cartKey).valueChanges().subscribe((result: any) => {
        delete result['lastUpdate'];
        console.log('cart changed: ', result);
        this.cart.next(result || {});
      });
    } else {
      const fbDocument = await this.afs.collection('carts').add({
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('new cart: ', fbDocument);
      this.cartKey = fbDocument.id;
      await Storage.set({ key: CART_STORAGE_KEY, value: this.cartKey });
    }
  }

  addToCart(id) {
    this.afs.collection('carts').doc(this.cartKey).update({
      [id]: INCREMENT,
      lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
    });

    this.productsCollection.doc(id).update({
      stock: DECREMENT
    });
  }

  removeFromCart(id) {
    this.afs.collection('carts').doc(this.cartKey).update({
      [id]: DECREMENT,
      lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
    });

    this.productsCollection.doc(id).update({
      stock: INCREMENT
    });
  }

  async checkoutCart() {
    await this.afs.collection('orders').add(this.cart.value);

    this.afs.collection('carts').doc(this.cartKey).set({
      lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
}
