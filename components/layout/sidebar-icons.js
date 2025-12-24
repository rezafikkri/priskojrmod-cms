import {
  Copyright,
  Users,
  Package,
  Activity,
  UserCog,
} from 'lucide-react';
import UserDollar from '../icon/user-dollar';
import Script from '../icon/script';
import Category from '../icon/category';
import Key from '../icon/key';
import LockPassword from '../icon/lock-password';

const sidebarIcons = {
  // Sales
  Transactions: Activity,

  // Customer
  Customers: UserDollar,
  List: UserDollar,
  Feedback: UserDollar,
  Testimonials: UserDollar,

  // Document
  Documents: Script,
  'Terms of service': Script,
  'Privacy policy': Script,
  'About us': Script,
  FAQs: Script,

  // Product
  Categories: Category,
  Licenses: Copyright,
  Owners: Users,
  Products: Package,

  // Application
  'License keys': Key,
  'Secret keys': LockPassword,

  // System
  Admins: UserCog,
};

export default sidebarIcons;
