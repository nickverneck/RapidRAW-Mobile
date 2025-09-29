struct BlurParams {
    radius: u32,
    tile_offset_x: u32,
    tile_offset_y: u32,
    _pad: u32,
}

@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var output_texture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> params: BlurParams;

fn gaussian(x: f32, sigma: f32) -> f32 {
    return exp(-(x * x) / (2.0 * sigma * sigma));
}

@compute @workgroup_size(256, 1, 1)
fn horizontal_blur(@builtin(global_invocation_id) id: vec3<u32>) {
    let dims = vec2<i32>(textureDimensions(output_texture));
    if (id.x >= u32(dims.x)) {
        return;
    }

    let radius = i32(params.radius);
    let sigma = f32(radius) / 2.0;

    let absolute_coord = vec2<u32>(id.x + params.tile_offset_x, id.y + params.tile_offset_y);
    let full_dims = vec2<i32>(textureDimensions(input_texture));

    var total_color = vec3<f32>(0.0);
    var total_weight = 0.0;

    for (var offset = -radius; offset <= radius; offset = offset + 1) {
        let sample_coord = clamp(
            vec2<i32>(i32(absolute_coord.x) + offset, i32(absolute_coord.y)),
            vec2<i32>(0),
            full_dims - 1
        );
        let color = textureLoad(input_texture, vec2<u32>(sample_coord), 0).rgb;
        let weight = gaussian(f32(offset), sigma);
        total_color += color * weight;
        total_weight += weight;
    }

    if (total_weight > 0.0) {
        total_color /= total_weight;
    }

    textureStore(output_texture, id.xy, vec4<f32>(total_color, 1.0));
}

@compute @workgroup_size(1, 256, 1)
fn vertical_blur(@builtin(global_invocation_id) id: vec3<u32>) {
    let dims = vec2<i32>(textureDimensions(output_texture));
    if (id.y >= u32(dims.y)) {
        return;
    }

    let radius = i32(params.radius);
    let sigma = f32(radius) / 2.0;

    let local_coord = vec2<i32>(id.xy);
    let input_dims = vec2<i32>(textureDimensions(input_texture));

    var total_color = vec3<f32>(0.0);
    var total_weight = 0.0;

    for (var offset = -radius; offset <= radius; offset = offset + 1) {
        let sample_coord = clamp(
            vec2<i32>(local_coord.x, local_coord.y + offset),
            vec2<i32>(0),
            input_dims - 1
        );
        let color = textureLoad(input_texture, vec2<u32>(sample_coord), 0).rgb;
        let weight = gaussian(f32(offset), sigma);
        total_color += color * weight;
        total_weight += weight;
    }

    if (total_weight > 0.0) {
        total_color /= total_weight;
    }

    textureStore(output_texture, id.xy, vec4<f32>(total_color, 1.0));
}