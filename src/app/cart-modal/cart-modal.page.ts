import { Component, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { take } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-cart-modal',
  templateUrl: './cart-modal.page.html',
  styleUrls: ['./cart-modal.page.scss'],
})
export class CartModalPage implements OnInit {

  products = [];

  constructor(
    private productService: ProductService,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    const cartItems = this.productService.cart.value;
    console.log(cartItems);

    this.productService.getProducts().pipe(take(1)).subscribe(allProducts => {
      this.products = allProducts.filter(p => cartItems[p.id]).map(product => {
        return {...product, count: cartItems[product.id]};
      });
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }

  checkout() {
    this.productService.checkoutCart();
    this.close();
  }

}
