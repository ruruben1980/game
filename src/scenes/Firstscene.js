class Firstscene extends Phaser.Scene {

    constructor() {
        super('Firstscene');
    }

    init() {
        //console.log('Firstscene');
    }

    preload() {
        this.load.path = './assets/';
        this.load.bitmapFont('desyrel', 'desyrel.png', 'desyrel.xml');

        //this.load.image(['doggy50']);
        this.load.image('sky', 'sky.png')
                .image('ground', 'platform.png')
                .image('star', 'star.png')
                .image('bomb', 'virus.png')
                .image('bullet', 'bullet.png');
        this.load.spritesheet('dude', 'dude.png', { frameWidth: 50, frameHeight: 65 });

        this.score = 0;
        this.gameOver = false;

        this.load.audio('pop',['pop.wav']);
        this.load.audio('shot',['rebound.wav']);
        this.load.audio('kill',['killed.wav']);
    }

    create() {

        this.weapon = 

        // Sonidos
        this.popSound = this.sound.add('shot');
        this.shotSound = this.sound.add('pop');
        this.killSound = this.sound.add('kill');

        this.add.image(400, 300, 'sky');

        this.platforms = this.physics.add.staticGroup();
        // Multiplico por 2 el tamaño de la imagen y repinto
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');

        this.player = this.physics.add.sprite(100, 450, 'dude');

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.playerVelocity = 160;

        //  Animaciones
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        //  Creamos el cursos de movimiento del jugador
        this.cursors = this.input.keyboard.createCursorKeys();

        //  Creamos las estrellas
        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 } // Hace que aparezcan las estrellas en posiciones de +70
        });

        this.stars.children.iterate(function (child) {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); // Hace que reboten de forma aleatoria con distintos valores
        });

        this.bombs = this.physics.add.group();
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet'

        });

        //  The score
        // this.scoreText = this.add.text(16, 16, 'Puntos: 0', { fontSize: '32px', fill: '#000' });
        this.scoreText =this.add.bitmapText(16, 16, 'desyrel', 'Puntos: 0', 48);

        //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.collider(this.player, this.bombs, this.hitPlayer, null, this);
        this.physics.add.collider(this.bullets, this.bombs, this.hitVirus, null, this);


        //  Colisiones
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.collider(this.bullets, this.platforms, this.destroyBullet, null, this);
    }

    update(time,delta) {
        if (this.gameOver)
        {
            return;
        }

        if (this.input.keyboard.checkDown(this.cursors.space, 250)) 
        {
            if (this.cursors.left.isDown)
                this.fire(this.player,-1);
            else
                this.fire(this.player,1);
        } 
        else if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-this.playerVelocity);  
            this.player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(this.playerVelocity);
            this.player.anims.play('right', true);
        }
        else
        {
            this.player.setVelocityX(0); 
            this.player.anims.play('turn');
        }
    
        if (this.cursors.up.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityY(-330);
        }
    }

    // Funciones propias
    collectStar (player, star)
    {
        this.popSound.play();
        star.disableBody(true, true);

        this.score += 10;
        this.scoreText.setText('Puntos: ' + this.score);

        // Si no quedan estrellas genero más
        if (this.stars.countActive(true) === 0)
        {
            this.stars.children.iterate(function (child) {
                child.enableBody(true, child.x, 0, true, true);
            });  

            var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

            var bomb = this.bombs.create(x, 16, 'bomb').setScale(0.5).refreshBody();;
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            bomb.allowGravity = false;  
        }
    }

    hitPlayer (player, virus)
    {
        this.physics.pause();
        this.player.tint = Math.random() * 0xffffff;
        this.player.angle = -90;
        player.anims.play('turn');
        this.gameOver = true;
    }

    destroyBullet(bullet) {
        bullet.destroy();
    }

    hitVirus(bullet, virus) {
        virus.destroy();
        bullet.destroy();
        this.killSound.play();
    }

    fire(object,direction) {
        var bullet = this.bullets.get(object.x + (direction*17), object.y);
        if (bullet) {
            bullet.setActive(true)
                  .setVisible(true)
                  .body.velocity.x = direction * 200;
        }
        bullet.outOfBoundsKill = true;
        bullet.body.allowGravity = false;
        this.shotSound.play();

    }
}

export default Firstscene;