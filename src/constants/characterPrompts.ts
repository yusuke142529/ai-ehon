/**
 * Basic design prompts for 50 animal characters (child versions).
 *
 * These prompts focus on the character’s physical traits and thematic details
 * in a straightforward, child-friendly way.
 */

type AnimalPrompt = {
    basic: string;
  };
  
  export const characterPrompts: Record<string, AnimalPrompt> = {
    Cat: {
      basic:
        "A kitten with short orange fur and bold stripes, a round head, upright ears, and a medium-length tail."
    },
    Dog: {
      basic:
        "A Shetland Sheepdog puppy with a tri-color coat of brown, white, and black, a slender muzzle, slightly drooping ears, and a fluffy tail."
    },
    Fox: {
      basic:
        "A fox kit with orange fur, a white underside, a long tail tipped in white, and large triangular ears."
    },
    Rabbit: {
      basic:
        "A young rabbit with short fur, long upright ears, and a small round tail; its body is slightly slender."
    },
    Raccoon: {
      basic:
        "A young raccoon with grayish fur, a black mask across the eyes, and a ringed tail; the head is somewhat rounded, and the ears are small."
    },
    "Raccoon Dog": {
      basic:
        "A young raccoon dog (tanuki) with brownish fur, darker facial markings, and a short, thick tail; its body is rounded."
    },
    Squirrel: {
      basic:
        "A young squirrel with reddish-brown fur on the back, a lighter underside, a large bushy tail, and small pointed ears."
    },
    Deer: {
      basic:
        "A fawn with light brown fur and white spots, a slender neck, relatively long legs, a short tail, and somewhat large ears."
    },
    Hedgehog: {
      basic:
        "A young hedgehog with short, soft quills on its back, a furry face, and small limbs."
    },
    Mouse: {
      basic:
        "A baby mouse with short gray fur, round ears, a thin long tail, and a very small body."
    },
    Bear: {
      basic:
        "A bear cub with a sturdy, rounded body, soft fur, a round head, small ears, and relatively short limbs."
    },
    Wolf: {
      basic:
        "A wolf pup with grayish fur, upright ears, a somewhat fluffy tail, and a lean build."
    },
    Panda: {
      basic:
        "A panda cub with distinct black and white patches, a round head, short limbs, and a chubby body shape."
    },
    Koala: {
      basic:
        "A koala joey with gray fur, large round ears, a short nose, and a compact body with slightly thick limbs."
    },
    Giraffe: {
      basic:
        "A giraffe calf with a still relatively short but long neck, light yellow fur, brown patches, and small horn-like knobs on its head."
    },
    Elephant: {
      basic:
        "An elephant calf with a short trunk, large floppy ears, gray skin, and thick, sturdy legs."
    },
    Lion: {
      basic:
        "A lion cub with light tawny fur, a small tuft at the tail tip, and if male, a slight hint of a future mane."
    },
    Tiger: {
      basic:
        "A tiger cub with orange fur, bold black stripes across the body, relatively short limbs, and a striped tail."
    },
    Leopard: {
      basic:
        "A leopard cub with yellowish fur patterned with black rosettes, a lithe body, and slightly long legs."
    },
    Cheetah: {
      basic:
        "A cheetah cub with tan fur covered in small black spots, slender legs, and a relatively long tail."
    },
    Kangaroo: {
      basic:
        "A kangaroo joey with large hind legs, small forearms, a thick long tail, and light brown fur."
    },
    Horse: {
      basic:
        "A foal with a small, compact body, long slender legs, a short mane, and a medium-length tail."
    },
    Zebra: {
      basic:
        "A zebra foal with black and white stripes all over its body, a short upright mane, and thin legs."
    },
    Donkey: {
      basic:
        "A donkey foal with gray or brown fur, large ears, a short mane, and a tail ending in a small tuft of hair."
    },
    Sheep: {
      basic:
        "A lamb with fluffy white wool, a small head, slightly outward ears, and a short tail."
    },
    Pig: {
      basic:
        "A piglet with pink skin covered in sparse short hair, a round snout, a short curly tail, and a stout body."
    },
    Cow: {
      basic:
        "A calf with a smallish body, spotted or solid coat, small horn buds beginning to grow, and sturdy legs."
    },
    Goat: {
      basic:
        "A kid goat with short budding horns, a small tuft of hair on the chin, and slim, firm legs."
    },
    Hamster: {
      basic:
        "A baby hamster with a small round body, short fur, tiny ears, very short tail, and chubby cheeks."
    },
    Snake: {
      basic:
        "A hatchling snake with a slender body covered in smooth scales, a slightly triangular head, and small eyes."
    },
    Frog: {
      basic:
        "A young frog with a rounded body, smooth skin, slightly larger hind legs, and short front limbs."
    },
    Crocodile: {
      basic:
        "A crocodile hatchling with a short snout, softer scales, a long tail, and relatively short legs."
    },
    Turtle: {
      basic:
        "A turtle hatchling with a rounded shell, short sturdy limbs, and a small head."
    },
    Dolphin: {
      basic:
        "A dolphin calf with a streamlined gray body, a dorsal fin, and a slight beak-shaped snout."
    },
    Whale: {
      basic:
        "A whale calf with a smaller version of the adult's large body, grayish or bluish skin, and a broad tail fluke."
    },
    Seal: {
      basic:
        "A seal pup with a plump body covered in gray or spotted fur, and flipper-like front and rear limbs."
    },
    Penguin: {
      basic:
        "A penguin chick with short black and white down feathers, small wings, and relatively large feet."
    },
    Chicken: {
      basic:
        "A chick with pale yellow downy feathers, a tiny beak, thin legs, and a very small body."
    },
    Duck: {
      basic:
        "A duckling with soft yellow down, a flat bill, and webbed feet, smaller than an adult duck."
    },
    Goose: {
      basic:
        "A gosling with light-colored down, a somewhat long neck, and webbed feet."
    },
    Owl: {
      basic:
        "An owlet with a round head, large forward-facing eyes, short downy feathers, and small wings."
    },
    Eagle: {
      basic:
        "An eaglet with a still-developing curved beak, small talons, and brownish juvenile feathers."
    },
    Falcon: {
      basic:
        "A young falcon with a short beak, slender legs, and brown or gray feathers marked by small spots."
    },
    Bat: {
      basic:
        "A bat pup with a small body, soft membrane wings, large ears, and a slightly rounded head."
    },
    Monkey: {
      basic:
        "An infant monkey with thin limbs, a long tail, mostly brown fur, and a flat face with a small nose."
    },
    Gorilla: {
      basic:
        "A gorilla infant with a relatively large head, short neck, long arms, and thick black fur."
    },
    Chimpanzee: {
      basic:
        "A chimpanzee infant covered in black hair, protruding ears, long arms and legs, and a lean frame."
    },
    Hippopotamus: {
      basic:
        "A hippopotamus calf with a thick gray body, a wide snout, short sturdy legs, and smooth skin."
    },
    Rhinoceros: {
      basic:
        "A rhinoceros calf with thick gray skin, a small emerging horn, and a heavy, robust build."
    },
    Bison: {
      basic:
        "A bison calf with a slightly oversized head, a developing hump over the shoulders, and brown fur."
    }
  };