<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/*
| TODO [B6] Escriba las tres pruebas. Cada una debe verificar el código
| de estado Y algo más (estructura, encabezado, mensaje o estado de la base).
|
| Quite el ->todo() de cada prueba al implementarla.
| Ejecute:  php artisan test --filter=EquipoApi
*/

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    // TODO
    $categoria = Categoria::factory()->create();

    $respuesta = $this->postJson('/api/equipos', [
        'codigo'            => 'EQ-0100',
        'nombre'            => 'Laptop Dell Latitude 5440',
        'categoria_id'      => $categoria->id,
        'fecha_adquisicion' => now()->subWeek()->format('Y-m-d'),
        'costo_interno'     => 850000,
    ]);

    $equipo = Equipo::where('codigo', 'EQ-0100')->first();

    $respuesta->assertCreated()
        ->assertHeader('Location', route('equipos.show', $equipo))
        ->assertJsonPath('data.codigo', 'EQ-0100')
        ->assertJsonPath('data.categoria.id', $categoria->id)
        ->assertJsonMissingPath('data.costo_interno');

    $this->assertDatabaseHas('equipos', [
        'codigo' => 'EQ-0100',
        'estado' => 'disponible',
    ]);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    // TODO
    $respuesta = $this->postJson('/api/equipos', [
        'codigo'            => 'XX',
        'nombre'            => 'ab',
        'categoria_id'      => 9999,
        'fecha_adquisicion' => now()->addDay()->format('Y-m-d'),
        'costo_interno'     => -5,
    ]);

    $respuesta->assertUnprocessable()
        ->assertJsonValidationErrors([
            'codigo',
            'nombre',
            'categoria_id',
            'fecha_adquisicion',
            'costo_interno',
        ])
        ->assertJsonPath('errors.codigo.0', 'El código debe tener el formato EQ-0000.');

    $this->assertDatabaseCount('equipos', 0);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    // TODO
    $equipo = Equipo::factory()->prestado()->create();

    $this->deleteJson("/api/equipos/{$equipo->id}")
        ->assertConflict()
        ->assertExactJson([
            'mensaje' => 'No se puede eliminar un equipo prestado.',
            'codigo'  => 'REGLA_NEGOCIO',
        ]);

    $this->assertDatabaseHas('equipos', ['id' => $equipo->id]);
});