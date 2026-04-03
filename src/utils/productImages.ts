import type { ImageSourcePropType } from 'react-native';

import type { Product } from '@/src/store/types';

const DEFAULT_IMAGES: ImageSourcePropType[] = [
  require('../../assets/images/currywurst.jpg'),
  require('../../assets/images/pommes.jpg'),
  require('../../assets/images/bratwurst.jpg'),
  require('../../assets/images/lahmacun.jpg'),
  require('../../assets/images/schaschlik.jpg'),
];

const NAME_HINTS: { pattern: RegExp; image: ImageSourcePropType }[] = [
  { pattern: /brat/i, image: require('../../assets/images/bratwurst.jpg') },
  { pattern: /curry/i, image: require('../../assets/images/currywurst.jpg') },
  { pattern: /pommes|fries/i, image: require('../../assets/images/pommes.jpg') },
  { pattern: /lahmacun|türk/i, image: require('../../assets/images/lahmacun.jpg') },
  { pattern: /schasch|spieß/i, image: require('../../assets/images/schaschlik.jpg') },
];

export function getProductImageSource(product: Product): ImageSourcePropType {
  if (product.imageUri) {
    return { uri: product.imageUri };
  }

  const byName = NAME_HINTS.find((entry) => entry.pattern.test(product.name));
  if (byName) {
    return byName.image;
  }

  return DEFAULT_IMAGES[Math.abs(product.id) % DEFAULT_IMAGES.length];
}
