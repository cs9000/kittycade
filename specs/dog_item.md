# Feature Spec: Dog Special Item

## 1. Summary

This document outlines the design for a new special item: the **Dog**. The Dog will act as a dynamic, lethal obstacle for the player's cat. When the Dog appears on the screen, it will periodically move based on a probability that increases with the game's level. A "bark radius" provides a warning to the player. If the cat's head collides with the Dog, the player will lose a life.

## 2. Gameplay Mechanics

### Spawning
- The Dog item will appear on the grid at random, unoccupied locations, similar to other items.
- It should be a rare item.
- Only one Dog can be on the screen at a time.

### Behavior
- On each game logic tick, the Dog has a probability of moving to a new random square on the grid.
- This probability increases as the game level increases, causing the Dog to move more frequently at higher levels.
- The Dog's target destination cannot be a square currently occupied by the cat's body, except for the cat's head (which triggers a lethal collision).
- The player must avoid the Dog.

### Interaction & Effects
- **Collision:**
    - **Lethal Collision:** Normally, a collision between the cat's head and the Dog is lethal. This occurs if the cat moves into the Dog's square, or if the Dog moves into the cat's head's square. The result is losing a life, identical to hitting a wall.
    - **Exception (Turbo Mode):** If the cat is in "turbo mode" (after eating catnip), a collision with the Dog is not lethal. Instead, the cat "captures" the Dog, which immediately disappears. The player is awarded **500 points**, and the level continues without loss of life.
- **Warning Radius:** A 1-grid cell radius exists around the Dog. If the cat's head enters this radius without colliding, it triggers a non-punitive warning:
    - A "bark" sound effect will play.
    - A visual "arf" text animation will float up from the Dog.

## 3. Visuals

- **Dog Sprite:** A simple, top-down sprite will be created to represent the Dog.
- **Collision Animation:** A visual effect can be shown on collision, similar to other game-ending collisions.
- **"Arf" Animation:** When the cat is in the warning radius, the word "arf" will float up from the dog, similar to the "Z's" that float up from the cat bed.

## 4. Sound

- **Spawn Sound:** A distinct sound effect (e.g., a quiet woof) will play when the Dog appears.
- **Warning Bark:** A bark sound will play when the cat enters the warning radius.
- **Collision Sound:** The existing `lose_life.wav` sound will be played upon collision.

## 5. Design & Tuning

- The base probability for the Dog's movement at level 1, and the scaling factor for subsequent levels, can be tuned during implementation to achieve the desired difficulty.
